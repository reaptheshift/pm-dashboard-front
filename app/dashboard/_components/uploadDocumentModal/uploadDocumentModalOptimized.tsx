"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DragDropArea } from "./dragDropArea";
import { FileDisplay } from "./fileDisplay";
import { FolderStructureDisplay } from "./folderStructure";
import { UploadProgress } from "./uploadProgress";
import { useFileManager } from "./useFileManager";
import { X } from "lucide-react";
import { uploadFileToXano } from "./uploadToXano";
import { getProjects, type Project } from "@/app/dashboard/_projects/_actions";
import type { UploadedFileInfo } from "./types";
import { cn } from "@/lib/utils";

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean, uploadedFiles?: UploadedFileInfo[]) => void;
}

export function UploadDocumentModalOptimized({
  open,
  onOpenChange,
}: UploadDocumentModalProps) {
  const [selectedProject, setSelectedProject] = React.useState<string>("");
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false);

  // Fetch projects when modal opens
  React.useEffect(() => {
    if (open) {
      fetchProjects();
    } else {
      // Reset selected project when modal closes
      setSelectedProject("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  const {
    selectedFiles,
    folderStructure,
    accumulatedFiles,
    accumulatedFolderStructure,
    uploadingFiles,
    isUploading,
    setSelectedFiles,
    setFolderStructure,
    setUploadingFiles,
    setIsUploading,
    addToAccumulatedFiles,
    clearAllAccumulatedFiles,
    moveCurrentToAccumulated,
    removeFileFromStructure,
    removeAccumulatedFile,
    removeFolderFromStructure,
    removeUploadingFile,
    flattenFolderStructure,
  } = useFileManager();

  // Prevent page navigation during upload
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isUploading) {
        e.preventDefault();
        e.returnValue =
          "Upload is in progress. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isUploading]);

  const handleFilesSelected = (files: File[]) => {
    // Always add to accumulated files for multiple selection
    addToAccumulatedFiles(files, null);
    setSelectedFiles([]);
    setFolderStructure(null);
  };

  const handleFolderSelected = (structure: any) => {
    // Always add to accumulated files for multiple selection
    addToAccumulatedFiles([], structure);
    setSelectedFiles([]);
    setFolderStructure(null);
  };

  const handleUpload = async () => {
    const hasAccumulatedFiles =
      accumulatedFiles.length > 0 || accumulatedFolderStructure;
    const hasCurrentFiles = selectedFiles.length > 0 || folderStructure;
    const hasFiles = hasAccumulatedFiles || hasCurrentFiles;

    if (!hasFiles || !selectedProject) return;

    setIsUploading(true);

    // Initialize upload items
    let initialUploadItems: any[] = [];

    // Use accumulated files/folders if available, otherwise use current selection
    const filesToUpload =
      accumulatedFiles.length > 0 ? accumulatedFiles : selectedFiles;
    const structureToUpload = accumulatedFolderStructure || folderStructure;

    if (structureToUpload) {
      // Upload folder structure
      initialUploadItems = flattenFolderStructure(structureToUpload);
    } else {
      // Upload individual files
      initialUploadItems = filesToUpload.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
        fileId: null,
      }));
    }

    setUploadingFiles(initialUploadItems);

    // Clear all files after starting upload
    clearAllAccumulatedFiles();

    const uploadedFiles: UploadedFileInfo[] = [];
    const projectIdNum = Number(selectedProject);
    const projectName = projects.find((p) => p.id === projectIdNum)?.name;

    try {
      const CONCURRENT_LIMIT = 10;
      const queue = [
        ...initialUploadItems.map((item, index) => ({ item, index })),
      ];
      let queueIndex = 0;
      let activeWorkers = 0;
      let completedCount = 0;
      const totalFiles = queue.length;
      let resolveAll: (() => void) | null = null;
      const allCompletePromise = new Promise<void>((resolve) => {
        resolveAll = resolve;
      });

      const checkCompletion = () => {
        if (
          completedCount === totalFiles &&
          activeWorkers === 0 &&
          resolveAll
        ) {
          resolveAll();
        }
      };

      const processUpload = async (queueItem: {
        item: any;
        index: number;
      }): Promise<void> => {
        const { item, index } = queueItem;

        setUploadingFiles((prev) => {
          const updated = [...prev];
          updated[index] = {
            ...updated[index],
            progress: 10,
            status: "uploading",
          };
          return updated;
        });

        try {
          const result = await uploadFileToXano(item.file, selectedProject);

          const uploadInfo: UploadedFileInfo = {
            fileId: result.fileId,
            fileName: result.fileName,
            fileSize: item.file.size,
            fileType: item.file.type || "application/octet-stream",
            projectId: projectIdNum,
            projectName,
          };

          setUploadingFiles((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              fileId: result.fileId,
              progress: 100,
              status: "uploaded" as const,
            };
            return updated;
          });

          uploadedFiles.push(uploadInfo);
        } catch (uploadError) {
          console.error(
            `Upload error for file ${item.file.name}:`,
            uploadError
          );
          setUploadingFiles((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              status: "error" as const,
            };
            return updated;
          });
        } finally {
          completedCount++;
          activeWorkers--;

          if (queueIndex < queue.length) {
            const nextItem = queue[queueIndex];
            queueIndex++;
            if (nextItem) {
              activeWorkers++;
              processUpload(nextItem).catch((err) => {
                console.error("Worker processUpload error:", err);
              });
            }
          }

          checkCompletion();
        }
      };

      const startIndex = queueIndex;
      queueIndex = Math.min(CONCURRENT_LIMIT, queue.length);
      for (let i = startIndex; i < queueIndex; i++) {
        activeWorkers++;
        processUpload(queue[i]).catch((err) => {
          console.error("Initial worker processUpload error:", err);
        });
      }

      await allCompletePromise;

      // Close modal after all uploads complete without reloading dashboard
      setTimeout(() => {
        setIsUploading(false);
        setUploadingFiles([]);
        onOpenChange(false);
      }, 1000);
    } catch (error) {
      console.error("Upload process error:", error);
      setIsUploading(false);
      setUploadingFiles([]);
    }
  };

  // Calculate total files to upload
  const calculateTotalFiles = () => {
    let total = accumulatedFiles.length;

    if (accumulatedFolderStructure) {
      const countFilesInFolder = (folder: any): number => {
        let count = folder.files.length;
        Object.values(folder.subfolders).forEach((subfolder: any) => {
          count += countFilesInFolder(subfolder);
        });
        return count;
      };
      total += countFilesInFolder(accumulatedFolderStructure);
    }

    return total;
  };

  const totalFiles = calculateTotalFiles();

  // Calculate total data size
  const calculateTotalSize = () => {
    let totalSize = 0;

    // Add size from individual files
    accumulatedFiles.forEach((file) => {
      totalSize += file.size;
    });

    // Add size from folder structure
    if (accumulatedFolderStructure) {
      const calculateSizeInFolder = (folder: any): number => {
        let size = folder.files.reduce(
          (acc: number, file: any) => acc + file.size,
          0
        );
        Object.values(folder.subfolders).forEach((subfolder: any) => {
          size += calculateSizeInFolder(subfolder);
        });
        return size;
      };
      totalSize += calculateSizeInFolder(accumulatedFolderStructure);
    }

    return totalSize;
  };

  const totalSize = calculateTotalSize();

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Prevent modal from closing during upload
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isUploading) {
      // Don't allow closing during upload
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "sm:max-w-[512px] max-h-[80vh] p-0 gap-0 flex flex-col",
          isUploading && "[&>button]:hidden"
        )}
        aria-describedby="upload-modal-description"
        onEscapeKeyDown={(e) => {
          if (isUploading) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => {
          if (isUploading) {
            e.preventDefault();
          }
        }}
      >
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="space-y-1">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Upload Documents
            </DialogTitle>
            <p id="upload-modal-description" className="text-sm text-gray-600">
              Upload documents to your project. Send and invitation to a new
              user to join your organization.
            </p>
            {isUploading && (
              <p className="text-xs text-orange-600 font-medium mt-2">
                ⚠️ Upload in progress. Please wait...
              </p>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
          {isUploading ? (
            /* Upload Progress UI */
            <div className="space-y-4">
              <UploadProgress
                uploadingFiles={uploadingFiles}
                onRemoveFile={removeUploadingFile}
              />
            </div>
          ) : (
            /* File Selection UI */
            <div className="space-y-5">
              {/* Drag and Drop Area */}
              <DragDropArea
                onFilesSelected={handleFilesSelected}
                onFolderSelected={handleFolderSelected}
                disabled={isUploading}
              />

              {/* Selected Files */}
              {(accumulatedFiles.length > 0 || accumulatedFolderStructure) && (
                <div className="space-y-2">
                  {/* Individual Files */}
                  {accumulatedFiles.length > 0 && (
                    <FileDisplay
                      files={accumulatedFiles}
                      title="Files:"
                      onRemoveFile={removeAccumulatedFile}
                    />
                  )}

                  {/* Folder Structure */}
                  {accumulatedFolderStructure && (
                    <FolderStructureDisplay
                      structure={accumulatedFolderStructure}
                      onRemoveFile={removeFileFromStructure}
                      onRemoveFolder={removeFolderFromStructure}
                    />
                  )}
                </div>
              )}

              {/* Enhanced Ready to Upload Summary */}
              {(accumulatedFiles.length > 0 || accumulatedFolderStructure) && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm font-semibold text-blue-900">
                          Ready to Upload:
                        </p>
                        <span className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full font-medium">
                          {totalFiles} file{totalFiles !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 font-medium">
                        Total size: {formatFileSize(totalSize)}
                      </p>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-100 text-red-500 hover:text-red-600"
                          title="Clear all selected files"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64" align="end">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-900">
                            Remove all files?
                          </p>
                          <p className="text-xs text-gray-500">
                            Are you sure you want to remove all files from
                            upload? This action cannot be undone.
                          </p>
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={clearAllAccumulatedFiles}
                              className="flex-1"
                            >
                              Remove All
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Close popover by clicking outside
                                document.body.click();
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Project Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Link to project <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
              disabled={isLoadingProjects || projects.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    isLoadingProjects
                      ? "Loading projects..."
                      : projects.length === 0
                      ? "No projects available"
                      : "Select Project"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={String(project.id)}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projects.length === 0 && !isLoadingProjects && (
              <p className="text-xs text-gray-500">
                No projects available. Please create a project first.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 mt-auto border-t border-gray-200 pt-4">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                if (!isUploading) {
                  onOpenChange(false);
                }
              }}
              disabled={isUploading}
              className="px-5 py-2.5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                (accumulatedFiles.length === 0 &&
                  !accumulatedFolderStructure &&
                  selectedFiles.length === 0 &&
                  !folderStructure) ||
                !selectedProject ||
                isUploading
              }
              className="px-5 py-2.5 bg-gray-950 hover:bg-gray-800 text-white"
            >
              {isUploading
                ? "Uploading..."
                : totalFiles > 0
                ? `Upload ${totalFiles} File${totalFiles !== 1 ? "s" : ""}`
                : "Upload Files"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
