"use client";

import { useState, useEffect, useMemo } from "react";
import { useHash } from "@/hooks/useHash";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DataTable } from "./_components/dataTable";
import { UploadDocumentModalWrapper } from "./_components/uploadDocumentModalWrapper";
import { DocumentsSkeleton } from "./_components/DocumentsSkeleton";
import { getDocuments, getDocumentById, deleteDocument } from "./_actions";
import type { Document } from "./_actions";
import type { UploadedFileInfo } from "../_components/uploadDocumentModal/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DocumentsContent() {
  const { hash } = useHash("#Documents");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      const response = await getDocuments();
      setDocuments(response.documents);
    } catch (err) {
      setError("Failed to load documents. Please try again.");
      setDocuments([]);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    loadDocuments();
  };

  // Handle upload completion - add files to table without full reload
  const handleUploadComplete = (uploadedFiles?: UploadedFileInfo[]) => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return;
    }

    // Convert uploaded files to Document format and add to state
    const newDocuments: Document[] = uploadedFiles.map((uploaded) => ({
      fileId: uploaded.fileId,
      fileName: uploaded.fileName,
      fileType: uploaded.fileType,
      fileSize: uploaded.fileSize,
      uploadTimestamp: new Date().toISOString(),
      processingStatus: "PROCESSING" as const,
      projectName: uploaded.projectName,
      projectId: uploaded.projectId,
    }));

    // Add new documents to the existing list (avoid duplicates)
    setDocuments((prev) => {
      const existingIds = new Set(prev.map((d) => d.fileId));
      const uniqueNew = newDocuments.filter((d) => !existingIds.has(d.fileId));
      return [...prev, ...uniqueNew];
    });
  };

  // Handle file download - either from URL or raw data
  const handleFileDownload = async (
    fileData: any,
    fileName: string,
    fileType: string = "application/pdf"
  ) => {
    try {
      // Option 1: Check if there's a download URL in the response
      const downloadUrl =
        fileData?.download_url ||
        fileData?.url ||
        fileData?.s3_url ||
        fileData?.presigned_url ||
        fileData?.temp_url;

      if (downloadUrl) {
        console.log("📥 Using download URL:", downloadUrl);
        // Open/download from URL
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = fileName;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // Option 2: Create blob from raw data and download immediately
      console.log("📥 Creating blob from raw data");
      const rawData =
        typeof fileData === "string" ? fileData : fileData?.data || fileData;

      if (!rawData) {
        throw new Error("No file data available");
      }

      let blob: Blob;

      // Try base64 decode first
      try {
        const cleaned = String(rawData).replace(/\s/g, "");
        const base64Pattern = /^[A-Za-z0-9+/=]+$/;
        if (base64Pattern.test(cleaned) && cleaned.length > 0) {
          const binaryString = atob(cleaned);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          blob = new Blob([bytes], { type: fileType });
          console.log("✅ Decoded as base64");
        } else {
          throw new Error("Not base64");
        }
      } catch {
        // Treat as raw string - convert to bytes
        console.log("📥 Treating as raw binary string");
        const dataString = String(rawData);
        const bytes = new Uint8Array(dataString.length);
        for (let i = 0; i < dataString.length; i++) {
          const charCode = dataString.charCodeAt(i);
          bytes[i] = charCode <= 255 ? charCode : 0;
        }
        blob = new Blob([bytes], { type: fileType });
      }

      // Trigger download immediately
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);

      console.log("✅ File download triggered");
    } catch (error) {
      console.error("❌ Error downloading file:", error);
      toast.error("Failed to download file", {
        description: error instanceof Error ? error.message : "Unknown error",
        duration: 4000,
      });
      throw error;
    }
  };

  // Deletion handled separately; no client delete logic here

  // Convert backend documents to table format
  const tableData = (documents || []).map((doc) => {
    // Map file type to valid FileType
    const getFileType = (
      fileType: string | undefined,
      fileName: string
    ): "DOC" | "PDF" | "CSV" | "PPTX" | "XLS" => {
      const type = fileType?.toLowerCase() || "";
      const name = fileName?.toLowerCase() || "";

      if (type.includes("pdf") || name.endsWith(".pdf")) return "PDF";
      if (
        type.includes("doc") ||
        type.includes("docx") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx")
      )
        return "DOC";
      if (
        type.includes("csv") ||
        type.includes("xlsx") ||
        type.includes("xls") ||
        name.endsWith(".csv") ||
        name.endsWith(".xlsx") ||
        name.endsWith(".xls")
      )
        return "XLS";
      if (
        type.includes("ppt") ||
        type.includes("pptx") ||
        name.endsWith(".ppt") ||
        name.endsWith(".pptx")
      )
        return "PPTX";
      if (name.endsWith(".dwg") || name.endsWith(".dxf")) return "DOC"; // DWG/DXF files as DOC type
      return "DOC"; // Default fallback
    };

    return {
      id: doc.fileId,
      fileName: doc.fileName,
      status:
        doc.processingStatus === "COMPLETED"
          ? "Archived"
          : doc.processingStatus === "PROCESSING"
          ? "Draft"
          : doc.processingStatus === "FAILED"
          ? "Deadline Passed"
          : "Accepting Bids",
      fileType: getFileType(doc.fileType, doc.fileName),
      size: formatFileSize(doc.fileSize),
      uploaded: new Date(doc.uploadTimestamp).toLocaleDateString("en-GB"),
      projectName: doc.projectName,
      parsingStatus: (() => {
        const status = doc.processingStatus.toLowerCase();
        switch (status) {
          case "completed":
            return "completed" as const;
          case "processing":
            return "processing" as const;
          case "failed":
            return "failed" as const;
          case "uploaded":
            return "uploaded" as const;
          default:
            return "uploaded" as const; // Default fallback
        }
      })(),
    };
  });

  const activeHeader = useMemo(() => {
    switch (hash) {
      case "#Dashboard":
        return "Dashboard";
      case "#Projects":
        return "Projects";
      case "#Users":
        return "Users";
      case "#Integrations":
        return "Integrations";
      case "#AI":
        return "AI assistant";
      case "#SystemLogs":
        return "System Logs";
      case "#Settings":
        return "Settings";
      case "#Documents":
      default:
        return "Documents";
    }
  }, [hash]);

  const shouldShowDocuments = hash === "#Documents" || hash === "";

  // Show skeleton loader while loading
  if (loading) {
    return <DocumentsSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {activeHeader}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Manual Refresh Button */}
          <button
            onClick={() => loadDocuments(true)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
            title="Refresh documents list"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>

          <UploadDocumentModalWrapper onUploadComplete={handleUploadComplete}>
            <button className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Documents
            </button>
          </UploadDocumentModalWrapper>
        </div>
      </div>

      {/* Metrics Cards */}
      {shouldShowDocuments && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Total Documents
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {(documents || []).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Processing
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    (documents || []).filter(
                      (d) => d.processingStatus === "PROCESSING"
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  Completed
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    (documents || []).filter(
                      (d) => d.processingStatus === "COMPLETED"
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    (documents || []).filter(
                      (d) => d.processingStatus === "FAILED"
                    ).length
                  }
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Section */}
      {shouldShowDocuments && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              Search & Filter
            </h3>
          </div>

          <div className="flex flex-col md:flex-row lg:flex-row gap-4 h-max items-stretch">
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  type="text"
                  placeholder="Search by key"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 flex">
              <Select>
                <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="By status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="accepting-bids">Accepting Bids</SelectItem>
                  <SelectItem value="deadline-passed">
                    Deadline Passed
                  </SelectItem>
                  <SelectItem value="awarded">Awarded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex">
              <Select>
                <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="By size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (&lt; 1MB)</SelectItem>
                  <SelectItem value="medium">Medium (1-5MB)</SelectItem>
                  <SelectItem value="large">Large (&gt; 5MB)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex">
              <Select>
                <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="By tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="photo">Photo</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex">
              <Select>
                <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="Sort by: Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="size-asc">
                    Size (Smallest First)
                  </SelectItem>
                  <SelectItem value="size-desc">
                    Size (Largest First)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      {shouldShowDocuments &&
        (error ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => loadDocuments(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <DataTable
            data={tableData}
            onDelete={async (fileId, fileName) => {
              const toastId = toast.loading("Deleting document...", {
                description: fileName,
                duration: Infinity,
              });

              try {
                await deleteDocument(fileId);

                // Optimistically remove from UI
                setDocuments((prev) => prev.filter((d) => d.fileId !== fileId));

                toast.success("Document deleted", {
                  id: toastId,
                  description: fileName,
                  duration: 3000,
                });
              } catch (e: any) {
                toast.error("Failed to delete document", {
                  id: toastId,
                  description:
                    e?.message || "An error occurred while deleting the file",
                  duration: 4000,
                });
              }
            }}
            onFileClick={async (fileId) => {
              console.log("🟢 DocumentsContent: onFileClick handler called", {
                fileId,
              });

              // Show loading toast with progress bar
              const toastId = toast.loading(
                "Requesting file from secure server...",
                {
                  description: (
                    <div className="space-y-2 mt-1">
                      <p className="text-sm text-gray-600">
                        Fetching document securely from server
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full animate-progress" />
                      </div>
                    </div>
                  ),
                  duration: Infinity, // Keep open until we dismiss it
                }
              );

              try {
                // Call secured Xano document details API when filename is clicked
                console.log("🟡 DocumentsContent: Calling getDocumentById...");
                const result = await getDocumentById(fileId);
                console.log(
                  "✅ DocumentsContent: getDocumentById success",
                  result
                );

                // Update toast to success
                toast.success("File retrieved successfully", {
                  id: toastId,
                  description: "Preparing download...",
                  duration: 2000,
                });

                // Extract file name from file_metadata (as per user requirements)
                const fileName =
                  result?.file_metadata?.file_name ||
                  result?.file?.name ||
                  result?.name ||
                  `document-${fileId}.pdf`;

                // Extract file type/mime
                const fileType =
                  result?.file_metadata?.file_mime ||
                  result?.file_metadata?.file_type ||
                  result?.file?.mime ||
                  result?.mime ||
                  "application/pdf";

                // Check for presigned S3 URL first (new expected format: file.url)
                const downloadUrl =
                  result?.file?.url ||
                  result?.file_metadata?.download_url ||
                  result?.file_metadata?.s3_url ||
                  result?.file_metadata?.presigned_url ||
                  result?.download_url ||
                  result?.s3_url ||
                  result?.presigned_url;

                if (downloadUrl) {
                  // Use the presigned S3 URL directly
                  console.log("📥 Using presigned S3 URL:", downloadUrl);

                  // Check expiration if available
                  const expiresAt = result?.file?.expires_at;
                  if (expiresAt) {
                    const expirationTime = parseInt(String(expiresAt));
                    const currentTime = Date.now();
                    if (currentTime >= expirationTime) {
                      toast.error("Download link expired", {
                        id: toastId,
                        description:
                          "The download link has expired. Please try again.",
                        duration: 4000,
                      });
                      return;
                    }
                    console.log(
                      "✅ URL valid until:",
                      new Date(expirationTime).toLocaleString()
                    );
                  }

                  // Open PDF in modal dialog with iframe
                  setPdfUrl(downloadUrl);
                  setPdfFileName(fileName);
                  setPdfViewerOpen(true);

                  toast.success("File loaded", {
                    id: toastId,
                    description: `Opening ${fileName} in viewer`,
                    duration: 2000,
                  });
                } else if (result?.file?.data || result?.data) {
                  // Fallback: Use raw file data if URL not available
                  console.log("⚠️ No URL found, using raw data as fallback");
                  const fileData = result?.file?.data || result?.data;
                  await handleFileDownload(fileData, fileName, fileType);
                } else {
                  toast.error("No file URL or data found", {
                    id: toastId,
                    description:
                      "The response does not contain a file URL or file data",
                    duration: 4000,
                  });
                }
              } catch (e: any) {
                console.error("❌ DocumentsContent: getDocumentById error", e);

                // Check if it's a 400 status code
                if (e?.status === 400) {
                  toast.error("Bad Request", {
                    id: toastId,
                    description:
                      e?.message ||
                      "Invalid request. Please check the file ID and try again.",
                    duration: 5000,
                  });
                  // Don't open anything for 400 errors
                  return;
                }

                // Handle other errors
                toast.error("Failed to retrieve file", {
                  id: toastId,
                  description:
                    e instanceof Error
                      ? e.message
                      : "An error occurred while fetching the document",
                  duration: 4000,
                });
              }
            }}
          />
        ))}

      {/* PDF Viewer Modal */}
      <Dialog open={pdfViewerOpen} onOpenChange={setPdfViewerOpen}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {pdfFileName}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden px-6 py-6 min-h-0">
            {pdfUrl && (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0 rounded-lg shadow-sm"
                title={pdfFileName}
                allow="fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DocumentsContent;
