"use client";

import {
  getCurrentUserId,
  getAuthTokenForClient,
} from "@/app/dashboard/_documents/_actions";

const XANO_BASE_URL = "https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv";

/**
 * Upload file directly to Xano
 */
export async function uploadFileToXano(
  file: File,
  projectId: string,
  userId?: number
): Promise<{ fileId: string; fileName: string }> {
  try {
    // Get user ID and auth token from server actions
    const [actualUserId, authToken] = await Promise.all([
      userId ? Promise.resolve(userId) : getCurrentUserId(),
      getAuthTokenForClient(),
    ]);

    if (!authToken) {
      throw new Error("Authentication required");
    }

    // Ensure projectId is a number
    const projectIdNum =
      typeof projectId === "string" ? Number(projectId) : projectId;
    if (isNaN(projectIdNum)) {
      throw new Error("Invalid project ID");
    }

    // Create FormData
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", String(projectIdNum));
    formData.append("user_id", String(actualUserId));

    // Upload to Xano with Authorization header
    const response = await fetch(`${XANO_BASE_URL}/documents/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Upload failed: ${response.status}${errorText ? ` - ${errorText}` : ""}`
      );
    }

    let fileId: string = file.name;
    let fileName: string = file.name;

    try {
      const responseText = await response.text();
      if (responseText && responseText.trim() !== "") {
        const result = JSON.parse(responseText);

        // New Xano response structure:
        // { id, name, mime, path, size, source, user_id, created_at, project_id, processing_status, ... }
        if (result.id) {
          fileId = result.id;
        }
        if (result.name) {
          fileName = result.name;
        }
      }
    } catch {
      // If parsing fails, use file name as fallback
    }

    return {
      fileId: String(fileId),
      fileName,
    };
  } catch (error) {
    console.error("Xano upload error:", error);
    throw error;
  }
}
