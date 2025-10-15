"use client";

import * as React from "react";
import { X, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { getFileTypeIcon, formatFileSize, FolderStructure } from "./utils";

interface FolderStructureProps {
  structure: FolderStructure;
  onRemoveFile: (file: File, folderPath: string[]) => void;
  onRemoveFolder?: (folderName: string) => void;
}

export function FolderStructureDisplay({
  structure,
  onRemoveFile,
  onRemoveFolder,
}: FolderStructureProps) {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(
    new Set()
  );

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderKey)) {
        newSet.delete(folderKey);
      } else {
        newSet.add(folderKey);
      }
      return newSet;
    });
  };

  const renderFolder = (
    folder: FolderStructure,
    level = 0,
    parentPath: string[] = []
  ) => {
    // Create unique key by including level and parent path
    const folderKey =
      parentPath.length > 0
        ? `${parentPath.join("/")}/${folder.name}-L${level}`
        : `${folder.name}-L${level}`;
    const isExpanded = expandedFolders.has(folderKey);
    const hasSubfolders = Object.keys(folder.subfolders).length > 0;
    const hasFiles = folder.files.length > 0;
    const shouldShowDropdown = hasSubfolders || hasFiles;
    const indent = level > 0 ? level * 20 : 0;

    return (
      <div key={folderKey} className="space-y-1">
        {/* Folder Header - skip Root folder */}
        {folder.name !== "Root" && (
          <div
            className={`flex items-center gap-3 text-sm font-medium text-gray-700 p-3 rounded transition-colors ${
              shouldShowDropdown
                ? "cursor-pointer hover:bg-gray-100"
                : "cursor-default"
            }`}
            style={{ paddingLeft: `${indent}px` }}
            onClick={
              shouldShowDropdown ? () => toggleFolder(folderKey) : undefined
            }
          >
            {/* Left side: Chevron + Folder Icon */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                {shouldShowDropdown ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )
                ) : (
                  <div className="w-4 h-4" />
                )}
              </div>

              {/* Folder Icon */}
              <svg
                className="w-6 h-6 text-blue-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M10,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V8C22,6.89 21.1,6 20,6H12L10,4Z" />
              </svg>
            </div>

            {/* Right side: Folder info div */}
            <div className="flex-1">
              {/* Folder Name */}
              <div className="text-sm font-medium text-gray-700">
                {folder.name}
              </div>

              {/* File Count and Size - Inline */}
              <div className="text-xs text-gray-500">
                {(() => {
                  const countFilesRecursively = (f: any): number => {
                    let count = f.files.length;
                    Object.values(f.subfolders).forEach((subfolder: any) => {
                      count += countFilesRecursively(subfolder);
                    });
                    return count;
                  };
                  const calculateSizeRecursively = (f: any): number => {
                    let size = f.files.reduce(
                      (acc: number, file: any) => acc + file.size,
                      0
                    );
                    Object.values(f.subfolders).forEach((subfolder: any) => {
                      size += calculateSizeRecursively(subfolder);
                    });
                    return size;
                  };
                  const fileCount = countFilesRecursively(folder);
                  const totalSize = calculateSizeRecursively(folder);
                  return `${fileCount} files • ${formatFileSize(totalSize)}`;
                })()}
              </div>
            </div>

            {/* Remove Button */}
            {onRemoveFolder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFolder(folder.name);
                }}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-500 text-gray-400 [&:hover]:bg-red-100 [&:hover]:text-red-500"
                title="Remove folder from upload"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {/* Files in this folder - show if folder is expanded and not Root */}
        {folder.name !== "Root" &&
          isExpanded &&
          folder.files.map((file, index) => (
            <div
              key={`${folderKey}-file-${index}`}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
              style={{
                paddingLeft: `${indent + 20}px`,
              }}
            >
              {/* File Icon - Bigger */}
              <Image
                src={getFileTypeIcon(file.name).icon}
                alt={getFileTypeIcon(file.name).alt}
                width={32}
                height={32}
                className="w-8 h-8 mt-1"
              />

              <div className="flex-1">
                {/* File Name */}
                <div className="text-sm font-medium text-gray-700 mb-1">
                  {file.name}
                </div>

                {/* File Size - Muted */}
                <div className="text-xs text-gray-400">
                  {formatFileSize(file.size)}
                </div>
              </div>

              {/* Remove Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveFile(file, parentPath)}
                className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-500 text-gray-400 [&:hover]:bg-red-100 [&:hover]:text-red-500"
                title="Remove file"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

        {/* Subfolders - show if folder is expanded or if it's Root */}
        {(isExpanded || folder.name === "Root") &&
          Object.values(folder.subfolders).map((subfolder, index) => {
            const newPath = [...parentPath, subfolder.name];
            // If this is Root folder, render subfolders at level 0 (no indentation)
            const subfolderLevel = folder.name === "Root" ? 0 : level + 1;
            return (
              <div key={`${folderKey}-subfolder-${index}`}>
                {renderFolder(subfolder, subfolderLevel, newPath)}
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          {structure.name === "Files" ? "Files:" : "Folders:"}
        </p>
      </div>
      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
        {renderFolder(structure, 0, [])}
      </div>
    </div>
  );
}
