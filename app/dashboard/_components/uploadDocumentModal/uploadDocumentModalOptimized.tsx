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
import { DragDropArea } from "./dragDropArea";
import { FileDisplay } from "./fileDisplay";
import { FolderStructureDisplay } from "./folderStructure";
import { UploadProgress } from "./uploadProgress";
import { useFileManager } from "./useFileManager";
import { X } from "lucide-react";
import {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadFolderFiles,
  type UploadResult,
  type FileUploadItem,
  type UploadOptions,
} from "./fileUpload";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/ui/multi-select";
import { getProjects } from "@/app/dashboard/_projects/_actions";

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDocumentModalOptimized({
  open,
  onOpenChange,
}: UploadDocumentModalProps) {
  const [selectedProjects, setSelectedProjects] = React.useState<string[]>([]);
  const [projectOptions, setProjectOptions] = React.useState<
    MultiSelectOption[]
  >([]);
  const [isLoadingProjects, setIsLoadingProjects] = React.useState(false);

  // Fetch projects when modal opens and reset state when it closes
  React.useEffect(() => {
    if (open) {
      fetchProjects();
    } else {
      // Reset selected projects when modal closes
      setSelectedProjects([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      const projects = await getProjects();
      const options: MultiSelectOption[] = projects.map((project) => ({
        label: project.name,
        value: project.id.toString(),
      }));
      setProjectOptions(options);
    } catch (error) {
      setProjectOptions([]);
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

    if (!hasFiles || selectedProjects.length === 0) return;

    setIsUploading(true);

    // Use accumulated files/folders if available, otherwise use current selection
    const filesToUpload =
      accumulatedFiles.length > 0 ? accumulatedFiles : selectedFiles;
    const structureToUpload = accumulatedFolderStructure || folderStructure;

    // Determine upload type based on what we have
    const isFolderUpload = structureToUpload !== null;
    const totalFilesCount = isFolderUpload
      ? flattenFolderStructure(structureToUpload).length
      : filesToUpload.length;
    const uploadType =
      totalFilesCount === 1 ? "single" : isFolderUpload ? "folder" : "multiple";

    // Initialize upload items for progress tracking
    let initialUploadItems: FileUploadItem[] = [];

    if (isFolderUpload) {
      initialUploadItems = flattenFolderStructure(structureToUpload!);
    } else {
      initialUploadItems = filesToUpload.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
        fileId: null,
      }));
    }

    setUploadingFiles(initialUploadItems);
    clearAllAccumulatedFiles();

    try {
      // uploadedBy will be auto-filled by uploadFile server action if not provided
      const uploadOptions = {
        projectId: selectedProjects[0],
        // uploadedBy omitted - will be auto-filled by server action
        onProgress: (progress: {
          fileId: string;
          progress: number;
          status: string;
        }) => {
          // Update progress for the specific file
          setUploadingFiles((prev) => {
            const updated = [...prev];
            const itemIndex = updated.findIndex(
              (u) => u.fileId === progress.fileId || progress.fileId === ""
            );
            if (itemIndex !== -1) {
              const normalizedStatus = progress.status?.toLowerCase();
              let statusText:
                | "uploading"
                | "uploaded"
                | "processing"
                | "completed"
                | "error" = "uploading";

              if (normalizedStatus === "uploaded") {
                statusText = "uploaded";
              } else if (normalizedStatus === "processing") {
                statusText = "processing";
              } else if (normalizedStatus === "completed") {
                statusText = "completed";
              } else if (
                normalizedStatus === "failed" ||
                normalizedStatus === "error"
              ) {
                statusText = "error";
              }

              updated[itemIndex] = {
                ...updated[itemIndex],
                fileId: progress.fileId || updated[itemIndex].fileId || null,
                progress: progress.progress,
                status: statusText,
              };
            }
            return updated;
          });
        },
      };

      let results: UploadResult[] = [];

      // Upload based on type
      if (uploadType === "single" && initialUploadItems.length === 1) {
        // Single file upload
        const result = await uploadSingleFile(
          initialUploadItems[0].file,
          uploadOptions
        );
        results = [result];
      } else if (uploadType === "folder" && isFolderUpload) {
        // Folder upload - all files from folder structure
        const allFiles = initialUploadItems.map((item) => item.file);

        // Use the same uploadOptions which already has progress tracking
        results = await uploadFolderFiles(allFiles, uploadOptions);
      } else {
        // Multiple file upload - use existing uploadOptions with progress tracking
        results = await uploadMultipleFiles(
          filesToUpload,
          uploadOptions,
          (index, result) => {
            // Update file ID when each file completes upload
            setUploadingFiles((prev) => {
              const updated = [...prev];
              if (updated[index]) {
                updated[index] = {
                  ...updated[index],
                  fileId: result.fileId,
                };
              }
              return updated;
            });
          }
        );
      }

      // Update all items with final results
      setUploadingFiles((prev) => {
        return prev.map((item, index) => {
          const result = results[index];
          if (result) {
            return {
              ...item,
              fileId: result.fileId,
              progress: 100,
              status: "completed" as const,
            };
          }
          return item;
        });
      });

      // Close modal after a short delay to show completion
      setTimeout(() => {
        setIsUploading(false);
        setUploadingFiles([]);
        onOpenChange(false);
      }, 2000);
    } catch (error) {
      setIsUploading(false);
      // Keep files in state so user can see which ones failed
      // Error is handled by individual file status updates
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[512px] max-h-[80vh] p-0 gap-0 flex flex-col"
        aria-describedby="upload-modal-description"
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
              Link to projects <span className="text-red-500">*</span>
            </label>
            <MultiSelect
              options={projectOptions}
              value={selectedProjects}
              onValueChange={setSelectedProjects}
              placeholder={
                isLoadingProjects
                  ? "Loading projects..."
                  : projectOptions.length === 0
                  ? "No projects available"
                  : "Select projects"
              }
              disabled={isLoadingProjects || projectOptions.length === 0}
              maxCount={2}
              searchable={true}
            />
            <p className="text-xs text-gray-500">
              Select one or more projects to link this document to.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 mt-auto border-t border-gray-200 pt-4">
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                selectedProjects.length === 0 ||
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
