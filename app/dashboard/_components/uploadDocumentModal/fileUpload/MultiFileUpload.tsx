"use client";

import * as React from "react";
import { uploadMultipleFiles } from "./uploadHandlers";
import type { UploadOptions, UploadResult } from "./types";

interface MultiFileUploadProps {
  files: File[];
  options: UploadOptions;
  onSuccess?: (results: UploadResult[]) => void;
  onError?: (error: Error) => void;
  onFileProgress?: (
    index: number,
    progress: { fileId: string; progress: number; status: string }
  ) => void;
  onFileComplete?: (index: number, result: UploadResult) => void;
}

interface FileUploadStatus {
  file: File;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  fileId?: string;
}

export function MultiFileUpload({
  files,
  options,
  onSuccess,
  onError,
  onFileProgress,
  onFileComplete,
}: MultiFileUploadProps) {
  const [fileStatuses, setFileStatuses] = React.useState<FileUploadStatus[]>(
    files.map((file) => ({
      file,
      status: "pending",
      progress: 0,
    }))
  );
  const [isUploading, setIsUploading] = React.useState(false);
  const [totalProgress, setTotalProgress] = React.useState(0);

  React.useEffect(() => {
    async function handleUploads() {
      setIsUploading(true);

      try {
        const results = await uploadMultipleFiles(
          files,
          options,
          (index, result) => {
            setFileStatuses((prev) => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                status: "completed",
                progress: 100,
                fileId: result.fileId,
              };
              return updated;
            });

            onFileComplete?.(index, result);
          }
        );

        onSuccess?.(results);
      } catch (error) {
        setFileStatuses((prev) =>
          prev.map((status) => ({ ...status, status: "error", progress: 0 }))
        );
        onError?.(error as Error);
      } finally {
        setIsUploading(false);
      }
    }

    handleUploads();
  }, [files]);

  // Calculate total progress
  React.useEffect(() => {
    const total = fileStatuses.reduce(
      (sum, status) => sum + status.progress,
      0
    );
    const average = fileStatuses.length > 0 ? total / fileStatuses.length : 0;
    setTotalProgress(average);
  }, [fileStatuses]);

  return {
    isUploading,
    totalProgress,
    fileStatuses,
    completedCount: fileStatuses.filter((s) => s.status === "completed").length,
    totalFiles: files.length,
  };
}
