"use server";

import { getAuthToken } from "@/lib/auth-server";

const XANO_BASE_URL = "https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv";

export interface Document {
  id: number;
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadTimestamp: string;
  uploadTimestampISO: string;
  processingStatus: "COMPLETED" | "PROCESSING" | "FAILED" | "PENDING";
  projectId: string | null;
  uploadedBy: string;
  metadata?: {
    chunkCount: number;
    textLength: number;
  };
}

export interface DocumentsResponse {
  documents: Document[];
  total: number;
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

// Fetch all documents
export async function getDocuments(): Promise<DocumentsResponse> {
  try {
    const authToken = await getAuthToken();

    const response = await fetch(`${XANO_BASE_URL}/documents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      // Add cache configuration for Next.js 16
      next: {
        revalidate: 60, // Revalidate every 60 seconds
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch documents");
  }
}

// Upload a file
export async function uploadDocument(
  formData: FormData
): Promise<UploadResponse> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${XANO_BASE_URL}/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        // Don't set Content-Type header, let fetch set it with boundary for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to upload document: ${response.statusText}`
      );
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to upload document");
  }
}

// Get file status
export async function getFileStatus(fileId: string): Promise<FileStatus> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    // Add cache-busting parameter to prevent 304 responses
    const timestamp = Date.now();
    const response = await fetch(
      `${XANO_BASE_URL}/documents/${fileId}/status?t=${timestamp}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-cache",
      }
    );

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const status = await response.json();
    return status;
  } catch (error: any) {
    throw new Error(error.message || "Failed to check file status");
  }
}

// Poll file status until completed or failed
export async function pollFileStatus(
  fileId: string,
  maxAttempts: number = 300,
  intervalMs: number = 2000
): Promise<FileStatus> {
  return new Promise((resolve, reject) => {
    let pollCount = 0;

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const status = await getFileStatus(fileId);

        const normalizedStatus = status.status?.toLowerCase();

        if (normalizedStatus === "completed" || normalizedStatus === "failed") {
          clearInterval(pollInterval);
          resolve(status);
        } else if (pollCount >= maxAttempts) {
          clearInterval(pollInterval);

          // Instead of rejecting, resolve with a timeout status
          resolve({
            fileId,
            status: "TIMEOUT",
            progress: status.progress || 0,
            message: `Processing is taking longer than expected. The file may still be processing in the background. Please refresh the page later to check status.`,
          });
        }
      } catch (error) {
        // On error, continue polling rather than rejecting immediately
        // Only reject after 5 consecutive errors
        if (pollCount % 5 === 0) {
          clearInterval(pollInterval);
          reject(error);
        }
      }
    }, intervalMs);
  });
}

// Delete a document
export async function deleteDocument(fileId: string): Promise<void> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${XANO_BASE_URL}/documents/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete document: ${response.statusText}`
      );
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete document");
  }
}
