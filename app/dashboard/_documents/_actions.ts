"use server";

import { getFileTypeFromExtension } from "@/lib/file-utils";

export interface Document {
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadTimestamp: string;
  processingStatus: "COMPLETED" | "PROCESSING" | "FAILED" | "PENDING";
  projectName?: string;
  projectId?: number;
  relationId?: number; // Relation ID from project relation for deletion
  metadata?: {
    chunkCount: number;
    textLength: number;
  };
}

// Xano document response format
interface XanoDocument {
  id: string;
  name: string;
  original_name: string;
  path: string;
  size: number;
  type: string;
  content_type: string;
  processing_status: string;
  created_at: number;
  project_id?: number;
  project?: {
    id: number;
    name: string;
    relation_id?: number; // Relation ID comes from the project relation
  };
  [key: string]: any;
}

// Transform Xano document to expected Document format
function transformXanoDocument(xanoDoc: XanoDocument): Document {
  // Map processing status (Xano uses lowercase, we need uppercase)
  const statusMap: Record<
    string,
    "COMPLETED" | "PROCESSING" | "FAILED" | "PENDING"
  > = {
    completed: "COMPLETED",
    processing: "PROCESSING",
    failed: "FAILED",
    pending: "PENDING",
  };

  const normalizedStatus = (
    xanoDoc.processing_status || "pending"
  ).toLowerCase();
  const processingStatus = statusMap[normalizedStatus] || "PENDING";

  // Convert timestamp from milliseconds to ISO string
  const uploadTimestamp = xanoDoc.created_at
    ? new Date(xanoDoc.created_at).toISOString()
    : new Date().toISOString();

  // Get file type from file extension
  const fileName = xanoDoc.original_name || xanoDoc.name || "";
  const fileType = getFileTypeFromExtension(fileName);

  return {
    fileId: xanoDoc.id,
    fileName: xanoDoc.original_name || xanoDoc.name || "Unknown file",
    fileType,
    fileSize: xanoDoc.size || 0,
    uploadTimestamp,
    processingStatus,
    projectName: xanoDoc.project?.name || undefined,
    projectId: xanoDoc.project_id || xanoDoc.project?.id || undefined,
    relationId: xanoDoc.project?.relation_id || undefined,
  };
}

export interface DocumentsResponse {
  documents: Document[];
  total: number;
  // Pagination metadata from API
  itemsReceived?: number;
  curPage?: number;
  nextPage?: number | null;
  prevPage?: number | null;
  offset?: number;
  perPage?: number;
  itemsTotal?: number;
  pageTotal?: number;
  // Status totals from API
  totalCompleted?: number;
  totalProcessing?: number;
  totalFailed?: number;
}

export interface SortParam {
  sortBy: string;
  order: "asc" | "desc";
}

export interface GetDocumentsParams {
  page?: number;
  per_page?: number;
  status?: string;
  query?: string;
  sort?: SortParam[];
}

// Get current user ID for client-side use
export async function getCurrentUserId(): Promise<number> {
  try {
    const { checkServerAuth } = await import("@/lib/auth-server");
    const user = await checkServerAuth();
    if (!user) {
      throw new Error("User not authenticated");
    }
    const userId = (user as any)?.id ?? (user as any)?.user_id;
    if (!userId) {
      throw new Error("User ID not found");
    }
    return typeof userId === "number" ? userId : Number(userId);
  } catch (error) {
    throw new Error("Failed to get user ID");
  }
}

// Get auth token for client-side use
export async function getAuthTokenForClient(): Promise<string | null> {
  try {
    const { getAuthToken } = await import("@/lib/auth-server");
    return await getAuthToken();
  } catch (error) {
    return null;
  }
}

// Get single document details from Xano by ID
export async function getDocumentById(documentsId: string) {
  try {
    if (!documentsId) {
      throw new Error("Document ID is required");
    }

    const { getAuthToken } = await import("@/lib/auth-server");
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const url = `https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv/documents/${encodeURIComponent(
      documentsId
    )}`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");

      // Create error object with status code for client-side handling
      const error: any = new Error(
        `Failed to fetch document: ${response.status}${
          errorText ? ` - ${errorText}` : ""
        }`
      );
      error.status = response.status;
      error.statusText = response.statusText;
      error.message =
        errorText || `HTTP ${response.status} ${response.statusText}`;
      throw error;
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw error;
  }
}

// Get all documents from Xano API with pagination, search, and filtering
export async function getDocuments(
  params?: GetDocumentsParams
): Promise<DocumentsResponse> {
  try {
    // Get auth token for Xano API
    const { getAuthToken } = await import("@/lib/auth-server");
    const token = await getAuthToken();

    if (!token || token.trim() === "") {
      throw new Error("Authentication required. Please log in again.");
    }

    const url = `https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv/documents`;

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) {
      queryParams.append("page", String(params.page));
    }
    if (params?.per_page !== undefined) {
      queryParams.append("per_page", String(params.per_page));
    }
    if (params?.status) {
      queryParams.append("status", params.status);
    }
    if (params?.query) {
      queryParams.append("query", params.query);
    }
    // Add sort as JSON string in query params if present
    if (params?.sort && params.sort.length > 0) {
      queryParams.append("sort", JSON.stringify(params.sort));
    }

    const finalUrl = queryParams.toString()
      ? `${url}?${queryParams.toString()}`
      : url;

    const response = await fetch(finalUrl, {
      method: "GET",
      cache: "no-cache",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      let errorMessage = `Failed to fetch documents: ${response.status}`;

      if (errorText) {
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage += ` - ${errorJson.message}`;
          } else {
            errorMessage += ` - ${errorText}`;
          }
        } catch {
          errorMessage += ` - ${errorText}`;
        }
      }

      // If it's an auth error, provide more specific message
      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 500
      ) {
        if (
          errorText.includes("not authorized") ||
          errorText.includes("authorized")
        ) {
          errorMessage +=
            " (Authentication may have expired. Please try logging in again.)";
        }
      }

      throw new Error(errorMessage);
    }

    const data = await response.json();

    // Handle new API response format with pagination
    let documentsArray: XanoDocument[] = [];

    if (data.items && Array.isArray(data.items)) {
      // New format with pagination metadata
      documentsArray = data.items;
    } else if (Array.isArray(data)) {
      // Direct array response (fallback)
      documentsArray = data;
    } else if (data.documents && Array.isArray(data.documents)) {
      // Nested documents array (fallback)
      documentsArray = data.documents;
    } else if (data.results && Array.isArray(data.results)) {
      // Alternative nested format (fallback)
      documentsArray = data.results;
    } else {
      // Fallback: try to find any array in the response
      throw new Error("Unexpected response format from Xano API");
    }

    // Transform Xano documents to expected Document format
    const transformedDocuments = documentsArray.map(transformXanoDocument);

    return {
      documents: transformedDocuments,
      total: data.itemsTotal || transformedDocuments.length,
      itemsReceived: data.itemsReceived,
      curPage: data.curPage,
      nextPage: data.nextPage,
      prevPage: data.prevPage,
      offset: data.offset,
      perPage: data.perPage,
      itemsTotal: data.itemsTotal,
      pageTotal: data.pageTotal,
      totalCompleted: data.totalCompleted,
      totalProcessing: data.totalProcessing,
      totalFailed: data.totalFailed,
    };
  } catch (error: any) {
    if (error.name === "TimeoutError" || error.name === "AbortError") {
      throw new Error(
        "Connection timeout: Unable to reach Xano API. Please check your network connection."
      );
    }
    if (
      error.message?.includes("ECONNREFUSED") ||
      error.message?.includes("timeout")
    ) {
      throw new Error(
        "Cannot connect to Xano API. Please verify your connection and authentication."
      );
    }
    throw error;
  }
}

// Delete a document by ID (secured)
export async function deleteDocument(
  documentsId: string
): Promise<{ success: boolean }> {
  try {
    if (!documentsId) {
      throw new Error("Document ID is required");
    }

    const { getAuthToken } = await import("@/lib/auth-server");
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const url = `https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv/documents/${encodeURIComponent(
      documentsId
    )}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-cache",
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const message = `Failed to delete document: ${response.status}${
        errorText ? ` - ${errorText}` : ""
      }`;
      const err: any = new Error(message);
      err.status = response.status;
      err.statusText = response.statusText;
      err.message =
        errorText || `HTTP ${response.status} ${response.statusText}`;
      throw err;
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
}

// Purge multiple documents by IDs (secured)
export async function purgeDocuments(
  documentsIds: string[]
): Promise<{ success: boolean }> {
  try {
    if (!Array.isArray(documentsIds) || documentsIds.length === 0) {
      throw new Error("At least one document ID is required");
    }

    const { getAuthToken } = await import("@/lib/auth-server");
    const token = await getAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    // Use dedicated purge endpoint accepting { documents_id: string[] }
    const url = `https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv/purge`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-cache",
      body: JSON.stringify({ documents_id: documentsIds }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      const message = `Failed to purge documents: ${response.status}${
        errorText ? ` - ${errorText}` : ""
      }`;
      const err: any = new Error(message);
      err.status = response.status;
      err.statusText = response.statusText;
      err.message =
        errorText || `HTTP ${response.status} ${response.statusText}`;
      throw err;
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
}
