"use client";

import * as React from "react";
import { Upload, FileText, Folder } from "lucide-react";
import { processFolderStructure } from "./utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type PathFile = { path: string; file: File };

interface DragDropAreaProps {
  onFilesSelected: (files: File[]) => void;
  onFolderSelected: (structure: any) => void;
  disabled?: boolean;
}

export function DragDropArea({
  onFilesSelected,
  onFolderSelected,
  disabled = false,
}: DragDropAreaProps) {
  const [dragActive, setDragActive] = React.useState(false);
  const [uploadMode, setUploadMode] = React.useState<"files" | "folders">(
    "files"
  );
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const folderInputRef = React.useRef<HTMLInputElement>(null);

  // Recursively read a FileSystemDirectoryEntry
  const readDirectory = React.useCallback(
    (dirEntry: any, prefix = ""): Promise<PathFile[]> => {
      return new Promise((resolve, reject) => {
        const reader = dirEntry.createReader();
        const entries: any[] = [];

        function readBatch() {
          reader.readEntries(async (batch: any[]) => {
            if (!batch.length) {
              // done
              const promises = entries.map((entry) =>
                entry.isFile
                  ? new Promise<PathFile[]>((res, rej) =>
                      entry.file(
                        (file: File) =>
                          res([{ path: prefix + entry.name, file }]),
                        rej
                      )
                    )
                  : readDirectory(entry, prefix + entry.name + "/")
              );
              try {
                const parts = await Promise.all(promises);
                resolve(parts.flat());
              } catch (e) {
                reject(e);
              }
              return;
            }
            entries.push(...batch);
            readBatch();
          }, reject);
        }

        readBatch();
      });
    },
    []
  );

  // Traverse DataTransferItemList using webkitGetAsEntry
  const traverseItems = React.useCallback(
    async (items: DataTransferItemList): Promise<PathFile[]> => {
      const out: PathFile[] = [];
      const tasks: Promise<PathFile[]>[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const entry = (item as any).webkitGetAsEntry?.(); // non-standard
        if (!entry) continue;

        if (entry.isFile) {
          // single file from DnD
          tasks.push(
            new Promise<PathFile[]>((resolve, reject) => {
              (entry as any).file(
                (file: File) => resolve([{ path: file.name, file }]),
                reject
              );
            })
          );
        } else if (entry.isDirectory) {
          tasks.push(readDirectory(entry, ""));
        }
      }

      const results = await Promise.all(tasks);
      out.push(...results.flat());
      return out;
    },
    [readDirectory]
  );

  const processFiles = React.useCallback(
    (files: File[]) => {
      // Check if any file has webkitRelativePath (indicates folder upload)
      const hasFolderStructure = files.some(
        (file) =>
          (file as any).webkitRelativePath &&
          (file as any).webkitRelativePath.includes("/")
      );

      if (hasFolderStructure) {
        // Process multiple folders by grouping files by their root folder
        const folderGroups = new Map<string, File[]>();

        files.forEach((file) => {
          const webkitPath = (file as any).webkitRelativePath;
          if (webkitPath && webkitPath.includes("/")) {
            const rootFolder = webkitPath.split("/")[0];
            if (!folderGroups.has(rootFolder)) {
              folderGroups.set(rootFolder, []);
            }
            folderGroups.get(rootFolder)!.push(file);
          }
        });

        // Process each folder group
        folderGroups.forEach((folderFiles) => {
          const structure = processFolderStructure(folderFiles);
          onFolderSelected(structure);
        });
      } else {
        onFilesSelected(files);
      }
    },
    [onFilesSelected, onFolderSelected]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = React.useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const items = e.dataTransfer.items;
      if (!items || items.length === 0) {
        // Fallback to regular file handling
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const files = Array.from(e.dataTransfer.files);
          processFiles(files);
        }
        return;
      }

      try {
        // Use webkitGetAsEntry API for proper folder support
        const pathFiles = await traverseItems(items);

        if (pathFiles.length > 0) {
          // Convert PathFile[] to File[] with webkitRelativePath
          const files = pathFiles.map(({ path, file }) => {
            // Create a new File object with the path information
            const fileWithPath = new File([file], file.name, {
              type: file.type,
              lastModified: file.lastModified,
            });
            // Set the webkitRelativePath on the new file
            Object.defineProperty(fileWithPath, "webkitRelativePath", {
              value: path,
              writable: false,
              enumerable: true,
              configurable: true,
            });
            return fileWithPath;
          });

          processFiles(files);
        }
      } catch (error) {
        // Fallback to regular file handling
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          const files = Array.from(e.dataTransfer.files);
          processFiles(files);
        }
      }

      // Clear the data transfer to allow re-dropping the same folder
      e.dataTransfer.clearData();
    },
    [traverseItems, processFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
      // Clear the input value to allow re-selecting the same folder
      e.target.value = "";
    }
  };

  const handleClick = () => {
    if (!disabled) {
      if (uploadMode === "files") {
        fileInputRef.current?.click();
      } else {
        folderInputRef.current?.click();
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Mode Tabs */}
      <Tabs
        value={uploadMode}
        onValueChange={(value) => setUploadMode(value as "files" | "folders")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="files" disabled={disabled}>
            <FileText className="w-4 h-4 mr-2" />
            Files
          </TabsTrigger>
          <TabsTrigger value="folders" disabled={disabled}>
            <Folder className="w-4 h-4 mr-2" />
            Folders
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Drag & Drop Area */}
      <div
        className={`
          border-2 border-dashed rounded-xl p-6 transition-colors cursor-pointer
          ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
            <Upload className="w-5 h-5 text-gray-600" />
          </div>
          <div className="text-center space-y-1">
            <div className="flex items-center justify-center space-x-1">
              <span className="text-sm font-semibold text-blue-600">
                Click to upload {uploadMode === "files" ? "files" : "folders"}
              </span>
              <span className="text-sm text-gray-600">or drag and drop</span>
            </div>
            <p className="text-xs text-gray-600">
              {uploadMode === "files"
                ? "PDF, DWG, TIFF"
                : "Drag folders or click to select multiple folders"}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />

        <input
          ref={folderInputRef}
          type="file"
          multiple
          {...({ webkitdirectory: "" } as any)}
          onChange={handleFileInput}
          className="hidden"
          title="Select folders to upload"
        />
      </div>
    </div>
  );
}
