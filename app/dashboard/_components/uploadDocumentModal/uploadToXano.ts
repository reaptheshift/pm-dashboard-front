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

    // Get response text first to check if it's empty or non-JSON
    const responseText = await response.text();

    if (!responseText || responseText.trim() === "") {
      throw new Error("Upload succeeded but response body is empty");
    }

    let result: any;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Xano response as JSON:", responseText);
      throw new Error(
        `Invalid JSON response from server: ${responseText.substring(0, 200)}`
      );
    }

    // Log full response for debugging
    console.log("Xano upload response:", result);

    // Xano response structure:
    // {
    //   file_uuid: "48630f67-8e73-4f19-97a1-dd7397a26fd8",
    //   ec_api_resp: {
    //     response: {
    //       result: { fileId, fileName, status, message, success }
    //     }
    //   }
    // }
    const responseData =
      result.ec_api_resp?.response?.result || result.result || result;

    // Extract fileId - prefer file_uuid at top level, then check nested structures
    const fileId =
      result.file_uuid ||
      responseData?.fileId ||
      responseData?.id ||
      result?.fileId ||
      result?.id;

    const fileName =
      responseData?.fileName ||
      responseData?.name ||
      result?.fileName ||
      result?.name ||
      file.name;

    if (!fileId) {
      console.error("Xano response missing file ID. Full response:", result);
      console.error("Response data extracted:", responseData);
      throw new Error(
        `Upload succeeded but no file ID returned. Response: ${JSON.stringify(
          result
        )}`
      );
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
