"use client";

import * as React from "react";
import { uploadSingleFile } from "./uploadHandlers";
import type { UploadOptions, UploadResult } from "./types";

interface SingleFileUploadProps {
  file: File;
  options: UploadOptions;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: {
    fileId: string;
    progress: number;
    status: string;
  }) => void;
}

export function SingleFileUpload({
  file,
  options,
  onSuccess,
  onError,
  onProgress,
}: SingleFileUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [status, setStatus] = React.useState<string>("ready");

  React.useEffect(() => {
    async function handleUpload() {
      setIsUploading(true);
      setStatus("uploading");
      setProgress(10);

      try {
        const result = await uploadSingleFile(file, {
          ...options,
          onProgress: (uploadProgress) => {
            setProgress(uploadProgress.progress);
            setStatus(uploadProgress.status);
            onProgress?.(uploadProgress);
          },
        });

        setProgress(100);
        setStatus("completed");
        onSuccess?.(result);
      } catch (error) {
        setStatus("error");
        setProgress(0);
        onError?.(error as Error);
      } finally {
        setIsUploading(false);
      }
    }

    handleUpload();
  }, [file]);

  return {
    isUploading,
    progress,
    status,
    fileName: file.name,
    fileSize: file.size,
  };
}
