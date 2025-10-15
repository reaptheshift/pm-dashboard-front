"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getFileTypeIcon, formatFileSize } from "./utils";

interface FileDisplayProps {
  files: File[];
  title: string;
  onRemoveFile: (index: number) => void;
}

export function FileDisplay({ files, title, onRemoveFile }: FileDisplayProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">{title}</p>
      </div>
      <div className="space-y-2">
        {files.map((file, index) => {
          const fileType = getFileTypeIcon(file.name);
          return (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Image
                  src={fileType.icon}
                  alt={fileType.alt}
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile(index)}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-500 text-gray-400 [&:hover]:bg-red-100 [&:hover]:text-red-500"
                title="Remove file"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
