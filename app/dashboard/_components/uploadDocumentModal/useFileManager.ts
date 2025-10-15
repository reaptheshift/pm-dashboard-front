"use client";

import * as React from "react";
import { FolderStructure } from "./utils";

interface FileUploadItem {
  file: File;
  progress: number;
  status: "uploading" | "uploaded" | "processing" | "completed" | "error";
  folderPath?: string;
  fileId?: string | null;
}

export function useFileManager() {
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const [folderStructure, setFolderStructure] =
    React.useState<FolderStructure | null>(null);
  const [accumulatedFiles, setAccumulatedFiles] = React.useState<File[]>([]);
  const [accumulatedFolderStructure, setAccumulatedFolderStructure] =
    React.useState<FolderStructure | null>(null);
  const [uploadingFiles, setUploadingFiles] = React.useState<FileUploadItem[]>(
    []
  );
  const [isUploading, setIsUploading] = React.useState(false);

  // Helper function to merge folder structures
  const mergeFolderStructures = (
    existing: FolderStructure | null,
    newStructure: FolderStructure
  ): FolderStructure => {
    if (!existing) {
      return newStructure;
    }

    // If both structures are single folders, create a root container
    if (
      existing.name !== "Root" &&
      newStructure.name !== "Files" &&
      Object.keys(newStructure.subfolders).length === 0
    ) {
      return {
        name: "Root",
        files: [],
        subfolders: {
          [existing.name]: existing,
          [newStructure.name]: newStructure,
        },
      };
    }

    // If existing is a single folder and new is a root structure, add existing as subfolder
    if (existing.name !== "Root" && newStructure.name === "Root") {
      return {
        name: "Root",
        files: newStructure.files,
        subfolders: {
          ...newStructure.subfolders,
          [existing.name]: existing,
        },
      };
    }

    // If new is a single folder and existing is a root structure, add new as subfolder
    if (
      existing.name === "Root" &&
      newStructure.name !== "Files" &&
      Object.keys(newStructure.subfolders).length === 0
    ) {
      return {
        name: "Root",
        files: existing.files,
        subfolders: {
          ...existing.subfolders,
          [newStructure.name]: newStructure,
        },
      };
    }

    // Both are root structures - merge them
    const mergedFiles = [...existing.files, ...newStructure.files];
    const mergedSubfolders = { ...existing.subfolders };
    Object.entries(newStructure.subfolders).forEach(([name, subfolder]) => {
      if (mergedSubfolders[name]) {
        // Recursively merge subfolders
        mergedSubfolders[name] = mergeFolderStructures(
          mergedSubfolders[name],
          subfolder
        );
      } else {
        mergedSubfolders[name] = subfolder;
      }
    });

    return {
      name: "Root",
      files: mergedFiles,
      subfolders: mergedSubfolders,
    };
  };

  // Function to add files to accumulated memory
  const addToAccumulatedFiles = (
    files: File[],
    structure: FolderStructure | null
  ) => {
    if (structure) {
      // Add folder structure
      setAccumulatedFolderStructure((prev) =>
        mergeFolderStructures(prev, structure)
      );
    } else {
      // Add individual files
      setAccumulatedFiles((prev) => [...prev, ...files]);
    }
  };

  // Function to clear all accumulated files
  const clearAllAccumulatedFiles = () => {
    setAccumulatedFiles([]);
    setAccumulatedFolderStructure(null);
    setSelectedFiles([]);
    setFolderStructure(null);
  };

  // Function to move current selection to accumulated files
  const moveCurrentToAccumulated = () => {
    if (selectedFiles.length > 0) {
      addToAccumulatedFiles(selectedFiles, null);
      setSelectedFiles([]);
    }
    if (folderStructure) {
      addToAccumulatedFiles([], folderStructure);
      setFolderStructure(null);
    }
  };

  // Function to remove a file from folder structure
  const removeFileFromFolderStructure = (
    structure: FolderStructure,
    targetFile: File,
    targetFolderPath: string[]
  ): FolderStructure | null => {
    // If we're at the target folder, remove the file
    if (targetFolderPath.length === 0) {
      const updatedFiles = structure.files.filter(
        (file) => file !== targetFile
      );
      if (
        updatedFiles.length === 0 &&
        Object.keys(structure.subfolders).length === 0
      ) {
        return null; // Remove empty folder
      }
      return { ...structure, files: updatedFiles };
    }

    // Navigate to the target folder
    const [nextFolderName, ...remainingPath] = targetFolderPath;
    const nextFolder = structure.subfolders[nextFolderName];

    if (!nextFolder) {
      return structure; // Folder not found, return unchanged
    }

    // Recursively remove from subfolder
    const updatedSubfolder = removeFileFromFolderStructure(
      nextFolder,
      targetFile,
      remainingPath
    );

    if (updatedSubfolder === null) {
      // Remove empty subfolder
      const remainingSubfolders = { ...structure.subfolders };
      delete remainingSubfolders[nextFolderName];
      return { ...structure, subfolders: remainingSubfolders };
    } else {
      // Update subfolder
      return {
        ...structure,
        subfolders: {
          ...structure.subfolders,
          [nextFolderName]: updatedSubfolder,
        },
      };
    }
  };

  const removeFileFromStructure = (file: File, folderPath: string[]) => {
    if (!accumulatedFolderStructure) return;

    const updatedStructure = removeFileFromFolderStructure(
      accumulatedFolderStructure,
      file,
      folderPath
    );
    setAccumulatedFolderStructure(updatedStructure);
  };

  // Function to remove individual file from accumulated files
  const removeAccumulatedFile = (index: number) => {
    setAccumulatedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to remove a folder from accumulated folder structure
  const removeFolderFromStructure = (folderName: string) => {
    setAccumulatedFolderStructure((prev) => {
      if (!prev) return null;

      // If it's a Root structure, remove the subfolder
      if (prev.name === "Root") {
        const updatedSubfolders = { ...prev.subfolders };
        delete updatedSubfolders[folderName];

        // If no subfolders left, return null
        if (Object.keys(updatedSubfolders).length === 0) {
          return null;
        }

        return {
          ...prev,
          subfolders: updatedSubfolders,
        };
      }

      // If it's a single folder with the same name, remove it entirely
      if (prev.name === folderName) {
        return null;
      }

      return prev;
    });
  };

  const removeUploadingFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to flatten folder structure for upload
  const flattenFolderStructure = React.useCallback(
    (folder: FolderStructure): FileUploadItem[] => {
      const items: FileUploadItem[] = [];

      // Add files from current folder
      folder.files.forEach((file) => {
        items.push({
          file,
          progress: 0,
          status: "uploading",
          folderPath: folder.name === "Root" ? undefined : folder.name,
        });
      });

      // Add files from subfolders
      Object.values(folder.subfolders).forEach((subfolder) => {
        const subfolderItems = flattenFolderStructure(subfolder);
        subfolderItems.forEach((item) => {
          items.push({
            ...item,
            folderPath:
              folder.name === "Root"
                ? item.folderPath
                : `${folder.name}/${item.folderPath || subfolder.name}`,
          });
        });
      });

      return items;
    },
    []
  );

  return {
    // State
    selectedFiles,
    folderStructure,
    accumulatedFiles,
    accumulatedFolderStructure,
    uploadingFiles,
    isUploading,

    // Setters
    setSelectedFiles,
    setFolderStructure,
    setUploadingFiles,
    setIsUploading,

    // Actions
    addToAccumulatedFiles,
    clearAllAccumulatedFiles,
    moveCurrentToAccumulated,
    removeFileFromStructure,
    removeAccumulatedFile,
    removeFolderFromStructure,
    removeUploadingFile,
    flattenFolderStructure,
  };
}
