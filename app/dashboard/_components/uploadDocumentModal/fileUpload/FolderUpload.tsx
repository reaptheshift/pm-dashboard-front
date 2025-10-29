"use client";

import * as React from "react";
import { uploadFolderFiles } from "./uploadHandlers";
import type { UploadOptions, UploadResult } from "./types";
import type { FolderStructure } from "../utils";

interface FolderUploadProps {
  folderStructure: FolderStructure;
  options: UploadOptions;
  onSuccess?: (results: UploadResult[]) => void;
  onError?: (error: Error) => void;
  onFileProgress?: (
    index: number,
    progress: { fileId: string; progress: number; status: string }
  ) => void;
}

interface FolderUploadStatus {
  files: Array<{
    file: File;
    folderPath: string;
    status: "pending" | "uploading" | "processing" | "completed" | "error";
    progress: number;
    fileId?: string;
  }>;
  totalProgress: number;
}

export function FolderUpload({
  folderStructure,
  options,
  onSuccess,
  onError,
  onFileProgress,
}: FolderUploadProps) {
  const [uploadStatus, setUploadStatus] = React.useState<FolderUploadStatus>({
    files: [],
    totalProgress: 0,
  });
  const [isUploading, setIsUploading] = React.useState(false);

  // Flatten folder structure to get all files with their paths
  React.useEffect(() => {
    function flattenFolder(
      folder: FolderStructure,
      basePath = ""
    ): Array<{ file: File; folderPath: string }> {
      const files: Array<{ file: File; folderPath: string }> = [];

      // Add files in current folder
      folder.files.forEach((file) => {
        files.push({
          file,
          folderPath: basePath || folder.name,
        });
      });

      // Add files from subfolders
      Object.entries(folder.subfolders).forEach(
        ([subfolderName, subfolder]) => {
          const subfolderPath = basePath
            ? `${basePath}/${subfolderName}`
            : subfolderName;
          files.push(...flattenFolder(subfolder, subfolderPath));
        }
      );

      return files;
    }

    const flattenedFiles = flattenFolder(folderStructure);

    setUploadStatus({
      files: flattenedFiles.map(({ file, folderPath }) => ({
        file,
        folderPath,
        status: "pending",
        progress: 0,
      })),
      totalProgress: 0,
    });
  }, [folderStructure]);

  React.useEffect(() => {
    if (uploadStatus.files.length === 0) return;

    async function handleFolderUpload() {
      setIsUploading(true);

      try {
        const results = await uploadFolderFiles(
          uploadStatus.files.map((f) => f.file),
          options
        );

        setUploadStatus((prev) => ({
          ...prev,
          files: prev.files.map((fileInfo, index) => ({
            ...fileInfo,
            status: "completed",
            progress: 100,
            fileId: results[index]?.fileId,
          })),
          totalProgress: 100,
        }));

        onSuccess?.(results);
      } catch (error) {
        setUploadStatus((prev) => ({
          ...prev,
          files: prev.files.map((fileInfo) => ({
            ...fileInfo,
            status: "error",
            progress: 0,
          })),
        }));
        onError?.(error as Error);
      } finally {
        setIsUploading(false);
      }
    }

    handleFolderUpload();
  }, [uploadStatus.files.length]);

  return {
    isUploading,
    uploadStatus,
    totalFiles: uploadStatus.files.length,
    completedFiles: uploadStatus.files.filter((f) => f.status === "completed")
      .length,
  };
}
