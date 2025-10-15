"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getFileTypeIcon, formatFileSize } from "./utils";

interface FileUploadItem {
  file: File;
  progress: number;
  status: "uploading" | "uploaded" | "processing" | "completed" | "error";
  folderPath?: string;
}

interface UploadProgressProps {
  uploadingFiles: FileUploadItem[];
  onRemoveFile: (index: number) => void;
}

export function UploadProgress({
  uploadingFiles,
  onRemoveFile,
}: UploadProgressProps) {
  if (uploadingFiles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No files to upload</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {uploadingFiles.map((item, index) => {
        const fileType = getFileTypeIcon(item.file.name);
        return (
          <div
            key={index}
            className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl"
          >
            {/* File Type Icon */}
            <div className="relative">
              <Image
                src={fileType.icon}
                alt={fileType.alt}
                width={40}
                height={40}
                className="w-10 h-10"
              />
              {item.status === "completed" && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            {/* File Info and Progress */}
            <div className="flex-1 space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700">
                  {item.file.name}
                </p>
                {item.folderPath && (
                  <p className="text-xs text-blue-600 font-medium">
                    📁 {item.folderPath}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formatFileSize(item.file.size)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.status === "completed"
                      ? "bg-green-500"
                      : item.status === "error"
                      ? "bg-red-500"
                      : item.status === "processing"
                      ? "bg-yellow-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {item.status === "completed"
                  ? "✅ Processing completed"
                  : item.status === "processing"
                  ? "🔄 Parsing and processing..."
                  : item.status === "uploaded"
                  ? "📤 File uploaded, starting processing..."
                  : item.status === "error"
                  ? "❌ Upload failed"
                  : `📤 ${item.progress}% uploaded`}
              </p>
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFile(index)}
              className="h-8 w-8 p-0 hover:bg-gray-200"
            >
              <X className="h-4 w-4 text-gray-500" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
