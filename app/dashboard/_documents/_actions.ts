"use server";

// Validate and normalize backend URL
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

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

export interface QueryResponse {
  query: string;
  answer: string;
  sources: Array<{
    fileId: string;
    fileName: string;
    pageNumber?: number;
    excerpt?: string;
  }>;
}

export interface UploadResponse {
  fileId: string;
  fileName: string;
  status: string;
  message: string;
}

export interface FileStatus {
  fileId: string;
  status: string;
  progress: number;
  message?: string;
  error?: string;
}

export interface DocumentsResponse {
  documents: Document[];
  total: number;
}

// StatusCallback type removed - polling with callbacks moved to client side

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

// Get current user ID for uploads (returns a numeric string)
async function getCurrentUserId(): Promise<string> {
  try {
    const { checkServerAuth } = await import("@/lib/auth-server");
    const user = await checkServerAuth();
    // Prefer numeric id; some backends require a number for uploadedBy
    const rawId = (user as any)?.id ?? (user as any)?.user_id;
    if (rawId !== undefined && rawId !== null) {
      const idStr = String(rawId);
      const idNum = Number(idStr);
      // Return numeric string if it parses, else the raw string
      if (!Number.isNaN(idNum)) return String(idNum);
      return idStr;
    }
    // As a strict fallback, return "0" (unauthenticated/system)
    return "0";
  } catch {
    return "0";
  }
}

// Get S3 pre-signed URL (server action - only returns URL, no file data)
export async function getS3UploadSignature(
  fileName: string,
  fileType: string,
  fileSize: number,
  projectId: string,
  uploadedBy?: string
): Promise<{
  s3Url: string;
  fileId: string;
  s3Key: string;
  headers?: Record<string, string>;
}> {
  // Auto-get user ID if not provided
  const actualUploadedBy = uploadedBy || (await getCurrentUserId());
  // Coerce projectId to a number where possible
  const projectIdNumeric = (() => {
    const n = Number(projectId);
    return Number.isNaN(n) ? projectId : n;
  })();

  const signatureResponse = await fetch(
    `${BACKEND_BASE_URL}/api/s3/upload-signature`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName,
        fileType: fileType || "application/octet-stream",
        fileSize,
        projectId: projectIdNumeric,
        uploadedBy: Number(actualUploadedBy) || actualUploadedBy,
      }),
    }
  );

  if (!signatureResponse.ok) {
    const errorText = await signatureResponse.text();
    throw new Error(
      `Signature request failed: ${signatureResponse.status} - ${errorText}`
    );
  }

  return await signatureResponse.json();
}

// Confirm S3 upload (server action - only sends metadata, no file)
export async function confirmS3Upload(
  fileId: string,
  s3Key: string,
  fileName: string,
  fileType: string,
  projectId: string,
  uploadedBy?: string
): Promise<UploadResponse> {
  // Auto-get user ID if not provided
  const actualUploadedBy = uploadedBy || (await getCurrentUserId());
  // Coerce projectId to a number where possible
  const projectIdNumeric = (() => {
    const n = Number(projectId);
    return Number.isNaN(n) ? projectId : n;
  })();

  const confirmResponse = await fetch(
    `${BACKEND_BASE_URL}/api/s3/confirm-upload`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileId,
        s3Key,
        fileName,
        fileType,
        projectId: projectIdNumeric,
        uploadedBy: Number(actualUploadedBy) || actualUploadedBy,
      }),
    }
  );

  if (!confirmResponse.ok) {
    throw new Error(`Confirm upload failed: ${confirmResponse.status}`);
  }

  return await confirmResponse.json();
}

// Get file status
export async function getFileStatus(fileId: string): Promise<FileStatus> {
  try {
    const timestamp = Date.now();
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/file/${fileId}/status?t=${timestamp}`,
      {
        cache: "no-cache",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const status = await response.json();
    return status;
  } catch (error: any) {
    throw new Error(error.message || "Failed to check file status");
  }
}

// Get file status (server action - no client callbacks)
export async function pollFileStatus(fileId: string): Promise<FileStatus> {
  return new Promise(async (resolve, reject) => {
    let pollCount = 0;
    const maxPolls = 300; // 10 minutes with 2-second intervals

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const currentStatus = await getFileStatus(fileId);

        const normalizedStatus = currentStatus.status?.toLowerCase();

        if (normalizedStatus === "completed" || normalizedStatus === "failed") {
          clearInterval(pollInterval);
          resolve(currentStatus);
        } else if (pollCount >= maxPolls) {
          clearInterval(pollInterval);
          resolve({
            fileId,
            status: "TIMEOUT",
            progress: currentStatus.progress || 0,
            message: `Processing is taking longer than expected. The file may still be processing in the background. Please refresh the page later to check status.`,
          });
        }
      } catch (error) {
        if (pollCount % 5 === 0) {
          clearInterval(pollInterval);
          reject(error);
        }
      }
    }, 2000);
  });
}

// Delete file by relation_id (from project relation)
export async function deleteFile(
  relationId: number | string
): Promise<{ success: boolean; message: string; fileId?: string }> {
  try {
    // Get auth token for Xano API
    const { getAuthToken } = await import("@/lib/auth-server");
    const token = await getAuthToken();

    const relationIdNum =
      typeof relationId === "string" ? Number(relationId) : relationId;

    if (isNaN(relationIdNum)) {
      throw new Error("Invalid relation ID provided");
    }

    const response = await fetch(
      `https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv/documents/${relationIdNum}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Delete failed: ${response.status}${errorText ? ` - ${errorText}` : ""}`
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete file");
  }
}

// Force sync with S3 storage
export async function syncWithS3(): Promise<{
  success: boolean;
  removed: string[];
  message: string;
}> {
  try {
    const response = await fetch(`${BACKEND_BASE_URL}/api/documents/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to sync with S3: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to sync with S3");
  }
}
