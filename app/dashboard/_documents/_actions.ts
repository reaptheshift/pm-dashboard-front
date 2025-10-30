"use server";

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

  // Map file type - use 'type' field (pdf, image) and derive from content_type or extension
  const rawType = (xanoDoc.type || "").toLowerCase();
  const contentType = (xanoDoc.content_type || "").toLowerCase();
  const fileName = xanoDoc.original_name || xanoDoc.name || "";
  const extension = fileName.split(".").pop()?.toUpperCase() || "";

  let fileType = "";

  // Direct type mapping (Xano returns lowercase: "pdf", "image")
  if (rawType === "pdf") {
    fileType = "PDF";
  } else if (rawType === "image") {
    // For images, check extension or content type
    const imageExtensions = ["JPG", "JPEG", "PNG", "GIF", "WEBP"];
    if (imageExtensions.includes(extension)) {
      // Images not in supported icon types, use DOC as fallback or handle specially
      // Since FileTypeIcon doesn't support images, we'll use DOC
      fileType = "DOC";
    } else {
      fileType = "DOC"; // Default for unknown image types
    }
  } else {
    // Derive from content_type
    if (contentType.includes("pdf")) {
      fileType = "PDF";
    } else if (
      contentType.includes("word") ||
      contentType.includes("document") ||
      contentType.includes("msword")
    ) {
      fileType = "DOC";
    } else if (
      contentType.includes("sheet") ||
      contentType.includes("excel") ||
      contentType.includes("spreadsheet")
    ) {
      fileType = "XLS";
    } else if (
      contentType.includes("csv") ||
      contentType.includes("comma-separated")
    ) {
      fileType = "CSV";
    } else if (
      contentType.includes("presentation") ||
      contentType.includes("powerpoint")
    ) {
      fileType = "PPTX";
    } else {
      // Fallback: derive from file extension
      const extensionMap: Record<string, string> = {
        PDF: "PDF",
        DOC: "DOC",
        DOCX: "DOC",
        XLS: "XLS",
        XLSX: "XLS",
        CSV: "CSV",
        PPT: "PPTX",
        PPTX: "PPTX",
      };
      fileType = extensionMap[extension] || "DOC"; // Default to DOC if unknown
    }
  }

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
  console.log("🟠 getDocumentById: Called with documentsId", documentsId);
  try {
    if (!documentsId) {
      throw new Error("Document ID is required");
    }

    const { getAuthToken } = await import("@/lib/auth-server");
    console.log("🟠 getDocumentById: Getting auth token...");
    const token = await getAuthToken();
    if (!token) {
      console.error("🟠 getDocumentById: No auth token found");
      throw new Error("Authentication required");
    }
    console.log(
      "🟠 getDocumentById: Auth token obtained",
      token.substring(0, 20) + "..."
    );

    const url = `https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv/documents/${encodeURIComponent(
      documentsId
    )}`;
    console.log("🟠 getDocumentById: Fetching URL", url);

    const response = await fetch(url, {
      method: "GET",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(30000),
    });

    console.log(
      "🟠 getDocumentById: Response status",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("🟠 getDocumentById: Response not OK", {
        status: response.status,
        errorText,
      });

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
    console.log("🟠 getDocumentById: Response data", result);
    return result;
  } catch (error) {
    console.error("🟠 getDocumentById: Error caught", error);
    throw error;
  }
}

// Get all documents from Xano API
export async function getDocuments(): Promise<DocumentsResponse> {
  try {
    // Get auth token for Xano API
    const { getAuthToken } = await import("@/lib/auth-server");
    const token = await getAuthToken();

    const response = await fetch(
      "https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv/documents",
      {
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        // Add timeout for connection issues
        signal: AbortSignal.timeout(30000), // 30 second timeout
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Failed to fetch documents: ${response.status}${
          errorText ? ` - ${errorText}` : ""
        }`
      );
    }

    const data = await response.json();

    // Handle different response formats from Xano
    let documentsArray: XanoDocument[] = [];

    if (Array.isArray(data)) {
      // Direct array response
      documentsArray = data;
    } else if (data.documents && Array.isArray(data.documents)) {
      // Nested documents array
      documentsArray = data.documents;
    } else if (data.results && Array.isArray(data.results)) {
      // Alternative nested format
      documentsArray = data.results;
    } else {
      // Fallback: try to find any array in the response
      throw new Error("Unexpected response format from Xano API");
    }

    // Transform Xano documents to expected Document format
    const transformedDocuments = documentsArray.map(transformXanoDocument);

    return {
      documents: transformedDocuments,
      total: transformedDocuments.length,
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
