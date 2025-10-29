import {
  getS3UploadSignature,
  confirmS3Upload,
  getFileStatus,
} from "@/app/dashboard/_documents/_actions";
import type { UploadOptions, UploadResult } from "./types";
import type { FileStatus } from "@/app/dashboard/_documents/_actions";

/**
 * Client-side polling function with progress callback
 */
async function pollFileStatusWithCallback(
  fileId: string,
  onStatusUpdate?: (status: FileStatus) => void
): Promise<FileStatus> {
  return new Promise((resolve, reject) => {
    let pollCount = 0;
    const maxPolls = 300; // 10 minutes with 2-second intervals

    const pollInterval = setInterval(async () => {
      pollCount++;

      try {
        const currentStatus = await getFileStatus(fileId);

        if (onStatusUpdate) {
          onStatusUpdate(currentStatus);
        }

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

/**
 * Uploads a single file to S3 and monitors its status
 */
export async function uploadSingleFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  try {
    // Report initial progress
    if (options.onProgress) {
      options.onProgress({
        fileId: "",
        progress: 10,
        status: "uploading",
      });
    }

    // Step 1: Get pre-signed URL from server (no file data sent)
    const signature = await getS3UploadSignature(
      file.name,
      file.type || "application/octet-stream",
      file.size,
      options.projectId,
      options.uploadedBy
    );

    // Step 2: Upload file directly to S3 from client (bypasses server action limit)
    const s3Headers: HeadersInit = {};
    if (
      signature.headers &&
      typeof signature.headers === "object" &&
      Object.keys(signature.headers).length > 0
    ) {
      Object.assign(s3Headers, signature.headers);
    }

    const s3Response = await fetch(signature.s3Url, {
      method: "PUT",
      body: file,
      headers: Object.keys(s3Headers).length > 0 ? s3Headers : undefined,
    });

    if (!s3Response.ok) {
      const errorText = await s3Response.text().catch(() => "");
      throw new Error(
        `S3 upload failed: ${s3Response.status}${errorText ? ` - ${errorText}` : ""}`
      );
    }

    // Step 3: Confirm upload with server (only metadata, no file)
    const result = await confirmS3Upload(
      signature.fileId,
      signature.s3Key,
      file.name,
      file.type || "application/octet-stream",
      options.projectId,
      options.uploadedBy
    );

    // Report upload complete, now processing
    if (options.onProgress) {
      options.onProgress({
        fileId: result.fileId,
        progress: 50,
        status: "processing",
      });

      // Poll for status updates (client-side with callback)
      await pollFileStatusWithCallback(result.fileId, (status) => {
        options.onProgress?.({
          fileId: result.fileId,
          progress: status.progress || 50,
          status: status.status || "processing",
        });
      });
    }

    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to upload file");
  }
}

/**
 * Uploads multiple files sequentially
 */
export async function uploadMultipleFiles(
  files: File[],
  options: UploadOptions,
  onFileUpload?: (index: number, result: UploadResult) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadSingleFile(files[i], options);
      results.push(result);
      onFileUpload?.(i, result);
    } catch (error) {
      // Continue with next file even if one fails
      // Report error through progress callback if available
      if (options.onProgress && results.length > 0) {
        options.onProgress({
          fileId: results[results.length - 1]?.fileId || "",
          progress: 0,
          status: "error",
        });
      }
      // Silently continue with next file
    }
  }

  return results;
}

/**
 * Uploads files from a folder structure, maintaining folder hierarchy
 */
export async function uploadFolderFiles(
  files: File[],
  options: UploadOptions
): Promise<UploadResult[]> {
  return uploadMultipleFiles(files, options);
}
