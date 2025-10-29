"use client";

import * as React from "react";
import {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadFolderFiles,
} from "./uploadHandlers";
import type { UploadOptions, UploadResult, UploadProgress } from "./types";
import type { FolderStructure } from "../utils";

export type UploadType = "single" | "multiple" | "folder";

interface UploadOrchestratorProps {
  type: UploadType;
  files?: File[];
  folderStructure?: FolderStructure | null;
  options: UploadOptions;
  onProgress?: (itemIndex: number, progress: UploadProgress) => void;
  onFileComplete?: (itemIndex: number, result: UploadResult) => void;
  onSuccess?: (results: UploadResult[]) => void;
  onError?: (error: Error) => void;
}

interface UploadState {
  items: Array<{
    file: File;
    folderPath?: string;
    status: "pending" | "uploading" | "completed" | "error";
    progress: number;
    fileId?: string;
  }>;
  isUploading: boolean;
  totalProgress: number;
}

export function UploadOrchestrator({
  type,
  files = [],
  folderStructure,
  options,
  onProgress,
  onFileComplete,
  onSuccess,
  onError,
}: UploadOrchestratorProps) {
  const [state, setState] = React.useState<UploadState>({
    items: [],
    isUploading: false,
    totalProgress: 0,
  });

  // Initialize items based on upload type
  React.useEffect(() => {
    if (type === "single" && files.length === 1) {
      setState({
        items: [
          {
            file: files[0],
            status: "pending",
            progress: 0,
          },
        ],
        isUploading: false,
        totalProgress: 0,
      });
    } else if (type === "multiple" && files.length > 1) {
      setState({
        items: files.map((file) => ({
          file,
          status: "pending",
          progress: 0,
        })),
        isUploading: false,
        totalProgress: 0,
      });
    } else if (type === "folder" && folderStructure) {
      // Flatten folder structure
      const flattenFolder = (
        folder: FolderStructure,
        basePath = ""
      ): Array<{ file: File; folderPath: string }> => {
        const items: Array<{ file: File; folderPath: string }> = [];

        folder.files.forEach((file) => {
          items.push({
            file,
            folderPath: basePath || folder.name,
          });
        });

        Object.entries(folder.subfolders).forEach(
          ([subfolderName, subfolder]) => {
            const subfolderPath = basePath
              ? `${basePath}/${subfolderName}`
              : subfolderName;
            items.push(...flattenFolder(subfolder, subfolderPath));
          }
        );

        return items;
      };

      const flattened = flattenFolder(folderStructure);
      setState({
        items: flattened.map(({ file, folderPath }) => ({
          file,
          folderPath,
          status: "pending",
          progress: 0,
        })),
        isUploading: false,
        totalProgress: 0,
      });
    }
  }, [type, files, folderStructure]);

  // Execute upload based on type
  const executeUpload = React.useCallback(async () => {
    if (state.items.length === 0) return;

    setState((prev) => ({ ...prev, isUploading: true }));

    try {
      let results: UploadResult[] = [];

      if (type === "single" && state.items.length === 1) {
        const result = await uploadSingleFile(state.items[0].file, {
          ...options,
          onProgress: (progress) => {
            setState((prev) => ({
              ...prev,
              items: prev.items.map((item, idx) =>
                idx === 0
                  ? { ...item, ...progress, status: "uploading" as const }
                  : item
              ),
              totalProgress: progress.progress,
            }));
            onProgress?.(0, progress);
          },
        });
        results = [result];
        onFileComplete?.(0, result);
      } else if (type === "multiple") {
        results = await uploadMultipleFiles(
          state.items.map((item) => item.file),
          {
            ...options,
            onProgress: (progress) => {
              // Match item by fileId, not by index
              setState((prev) => ({
                ...prev,
                items: prev.items.map((item) =>
                  item.fileId === progress.fileId ||
                  (!item.fileId && progress.fileId === "")
                    ? {
                        ...item,
                        progress: progress.progress,
                        status: "uploading" as const,
                        fileId: progress.fileId || item.fileId,
                      }
                    : item
                ),
                totalProgress: progress.progress,
              }));
            },
          },
          onFileComplete
        );
      } else if (type === "folder") {
        results = await uploadFolderFiles(
          state.items.map((item) => item.file),
          options
        );
      }

      // Mark all as completed
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item, idx) => ({
          ...item,
          status: "completed",
          progress: 100,
          fileId: results[idx]?.fileId,
        })),
        totalProgress: 100,
      }));

      onSuccess?.(results);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) => ({
          ...item,
          status: "error",
          progress: 0,
        })),
        isUploading: false,
      }));
      onError?.(error as Error);
    } finally {
      setState((prev) => ({ ...prev, isUploading: false }));
    }
  }, [
    type,
    state.items,
    options,
    onProgress,
    onFileComplete,
    onSuccess,
    onError,
  ]);

  return {
    executeUpload,
    state,
  };
}
