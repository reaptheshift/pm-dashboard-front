"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { TablePagination } from "./_components/tablePagination";
import { getFileTypeFromExtension } from "@/lib/file-utils";
import {
  getDocuments,
  getDocumentById,
  deleteDocument,
  purgeDocuments,
} from "./_actions";
import type { Document } from "./_actions";
import type { UploadedFileInfo } from "../_components/uploadDocumentModal/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DocumentsContent() {
  const { hash } = useHash("#Documents");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  // Pagination and filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [debouncedStatusFilter, setDebouncedStatusFilter] =
    useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date-desc");
  const [debouncedSortBy, setDebouncedSortBy] = useState<string>("date-desc");
  const [tableLoading, setTableLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [paginationData, setPaginationData] = useState<{
    itemsTotal?: number;
    pageTotal?: number;
    curPage?: number;
    nextPage?: number | null;
    prevPage?: number | null;
    totalCompleted?: number;
    totalProcessing?: number;
    totalFailed?: number;
  }>({});

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  // Format date-time as dd/MM/yyyy HH:mm
  const formatDateTime = (value: string | Date): string => {
    const d = typeof value === "string" ? new Date(value) : value;
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const loadDocuments = useCallback(
    async (showLoading = true, showTableLoading = false) => {
      try {
        if (showLoading) {
          setLoading(true);
        }
        if (showTableLoading) {
          setTableLoading(true);
        }
        setError(null);

        // Parse sort parameter - only send if a valid sort option is selected
        let sortParam: { sortBy: string; order: "asc" | "desc" }[] | undefined;
        if (debouncedSortBy && debouncedSortBy !== "date-desc") {
          // Only send sort if it's not the default "date-desc"
          const [field, order] = debouncedSortBy.split("-");
          let sortByField = "";
          if (field === "date") {
            sortByField = "created_at";
          } else if (field === "name") {
            sortByField = "name";
          } else if (field === "size") {
            sortByField = "size";
          }

          // Only create sort param if we have a valid field and order
          if (sortByField && (order === "asc" || order === "desc")) {
            sortParam = [
              { sortBy: sortByField, order: order as "asc" | "desc" },
            ];
          }
        }

        const response = await getDocuments({
          page: currentPage,
          per_page: perPage,
          status:
            debouncedStatusFilter === "all" ? undefined : debouncedStatusFilter,
          query: debouncedSearchQuery || undefined,
          sort: sortParam,
        });
        setDocuments(response.documents);
        setPaginationData({
          itemsTotal: response.itemsTotal,
          pageTotal: response.pageTotal,
          curPage: response.curPage,
          nextPage: response.nextPage,
          prevPage: response.prevPage,
          totalCompleted: response.totalCompleted,
          totalProcessing: response.totalProcessing,
          totalFailed: response.totalFailed,
        });
      } catch (err) {
        setError("Failed to load documents. Please try again.");
        setDocuments([]);
      } finally {
        if (showLoading) {
          setLoading(false);
        }
        if (showTableLoading) {
          setTableLoading(false);
        }
      }
    },
    [
      currentPage,
      perPage,
      debouncedStatusFilter,
      debouncedSearchQuery,
      debouncedSortBy,
    ]
  );

  // Debounce search query - only trigger API call after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Debounce status filter - only trigger API call after user stops changing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedStatusFilter(statusFilter);
      setCurrentPage(1); // Reset to first page on filter change
    }, 300); // 300ms delay (shorter for selects)

    return () => clearTimeout(timer);
  }, [statusFilter]);

  // Debounce sort - only trigger API call after user stops changing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSortBy(sortBy);
      setCurrentPage(1); // Reset to first page on sort change
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [sortBy]);

  // Track initial load
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load documents on mount and when filters change (only show table loading for filter changes)
  useEffect(() => {
    loadDocuments(isInitialLoad, !isInitialLoad);
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [loadDocuments, isInitialLoad]);

  // Manual refresh function
  const handleRefresh = () => {
    loadDocuments();
  };

  // Handle upload completion - refresh documents list to show uploaded files
  const handleUploadComplete = async (uploadedFiles?: UploadedFileInfo[]) => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      // Even if no files, refresh to get latest state
      await loadDocuments(false, true);
      return;
    }

    // Reset to first page and clear filters to ensure new files are visible
    setCurrentPage(1);
    setSearchQuery("");
    setStatusFilter("all");

    // Optimistically add uploaded files immediately
    setDocuments((prev) => {
      const existingIds = new Set(prev.map((d) => d.fileId));
      const missingFiles = uploadedFiles.filter(
        (uploaded) => !existingIds.has(uploaded.fileId)
      );

      if (missingFiles.length > 0) {
        // Convert uploaded files to Document format and add to state
        const newDocuments: Document[] = missingFiles.map((uploaded) => ({
          fileId: uploaded.fileId,
          fileName: uploaded.fileName,
          fileType: uploaded.fileType,
          fileSize: uploaded.fileSize,
          uploadTimestamp: new Date().toISOString(),
          processingStatus: "PROCESSING" as const,
          projectName: uploaded.projectName,
          projectId: uploaded.projectId,
        }));

        // Update pagination totals optimistically
        setPaginationData((prev) => ({
          ...prev,
          itemsTotal: (prev.itemsTotal || 0) + missingFiles.length,
          totalProcessing: (prev.totalProcessing || 0) + missingFiles.length,
        }));

        return [...prev, ...newDocuments];
      }

      return prev;
    });

    // Refresh documents list after delay to get accurate totals from API
    setTimeout(async () => {
      await loadDocuments(false, true);
    }, 2000);
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
      fileType: getFileTypeFromExtension(doc.fileName),
      size: formatFileSize(doc.fileSize),
      uploaded: formatDateTime(doc.uploadTimestamp),
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
          {/* Purge All Button */}
          <Dialog open={purgeOpen} onOpenChange={setPurgeOpen}>
            <Button
              onClick={() => setPurgeOpen(true)}
              disabled={documents.length === 0 || isPurging}
              variant="destructive"
              size="default"
              title={
                documents.length === 0
                  ? "No documents to purge"
                  : "Purge all documents"
              }
            >
              ⚠️ Purge
            </Button>
            <DialogContent className="sm:max-w-[520px]">
              <DialogHeader>
                <DialogTitle className="text-red-600">
                  ⚠️ Purge all data
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-gray-700">
                <p className="font-medium">
                  This action will permanently delete all documents.
                </p>
                <p>
                  This includes every item listed in the Documents table. This
                  cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setPurgeOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  variant="outline"
                  size="default"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (isPurging) return;
                    const toastId = toast.loading("Purging all documents...", {
                      duration: Infinity,
                    });
                    setIsPurging(true);
                    try {
                      // First, fetch total count if not available
                      let totalItems = paginationData.itemsTotal;
                      if (!totalItems) {
                        const countResponse = await getDocuments({
                          page: 1,
                          per_page: 1,
                        });
                        totalItems = countResponse.itemsTotal || 1000;
                      }

                      // Then fetch all documents with per_page = total items
                      const allDocsResponse = await getDocuments({
                        per_page: totalItems,
                      });
                      const allIds = allDocsResponse.documents.map(
                        (d) => d.fileId
                      );
                      if (allIds.length === 0) {
                        toast.error("No documents to purge", {
                          id: toastId,
                          duration: 3000,
                        });
                        setPurgeOpen(false);
                        return;
                      }
                      await purgeDocuments(allIds);
                      setDocuments([]);
                      setPurgeOpen(false);
                      toast.success("All documents purged", {
                        id: toastId,
                        duration: 3000,
                      });
                      // Refresh the list
                      setCurrentPage(1);
                      loadDocuments();
                    } catch (e: any) {
                      toast.error("Failed to purge documents", {
                        id: toastId,
                        description: e?.message || "Unexpected error",
                        duration: 4000,
                      });
                    } finally {
                      setIsPurging(false);
                    }
                  }}
                  disabled={isPurging}
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: "#dc2626" }}
                >
                  {isPurging ? "Purging..." : "Yes, purge all"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Manual Refresh Button */}
          <Button
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
          </Button>

          <UploadDocumentModalWrapper onUploadComplete={handleUploadComplete}>
            <Button className="bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors">
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
            </Button>
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
                  {paginationData.itemsTotal || (documents || []).length}
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
                  {paginationData.totalProcessing ?? 0}
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
                  {paginationData.totalCompleted ?? 0}
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
                  {paginationData.totalFailed ?? 0}
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
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Don't reset page here - debounce will handle it
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 flex">
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value);
                  // Don't reset page here - debounce will handle it
                }}
              >
                <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="By status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
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
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  // Don't reset page here - debounce will handle it
                }}
              >
                <SelectTrigger className="w-full flex-1 px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <SelectValue placeholder="Sort by: Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
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
        ) : !loading &&
          (documents.length === 0 || paginationData.itemsTotal === 0) ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 shadow-sm text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No documents yet
            </h3>
            <p className="text-gray-500 mb-4">
              Upload your first documents to get started.
            </p>
            <UploadDocumentModalWrapper onUploadComplete={handleUploadComplete}>
              <Button className="bg-gray-900 text-white hover:bg-gray-800">
                Upload Documents
              </Button>
            </UploadDocumentModalWrapper>
          </div>
        ) : (
          <>
            <div className="relative">
              {tableLoading && (
                <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
                    <p className="text-sm text-gray-600">
                      Loading documents...
                    </p>
                  </div>
                </div>
              )}
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
                    setDocuments((prev) =>
                      prev.filter((d) => d.fileId !== fileId)
                    );

                    toast.success("Document deleted", {
                      id: toastId,
                      description: fileName,
                      duration: 3000,
                    });
                  } catch (e: any) {
                    toast.error("Failed to delete document", {
                      id: toastId,
                      description:
                        e?.message ||
                        "An error occurred while deleting the file",
                      duration: 4000,
                    });
                  }
                }}
                onFileClick={async (fileId) => {
                  console.log(
                    "🟢 DocumentsContent: onFileClick handler called",
                    {
                      fileId,
                    }
                  );

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
                    console.log(
                      "🟡 DocumentsContent: Calling getDocumentById..."
                    );
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
                      console.log(
                        "⚠️ No URL found, using raw data as fallback"
                      );
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
                    console.error(
                      "❌ DocumentsContent: getDocumentById error",
                      e
                    );

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
            </div>
            {/* Pagination Controls */}
            {paginationData.pageTotal &&
              paginationData.pageTotal > 0 &&
              paginationData.itemsTotal &&
              paginationData.itemsTotal > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-700">
                        Items per page:
                      </span>
                      <Select
                        value={String(perPage)}
                        onValueChange={(value) => {
                          setPerPage(Number(value));
                          setCurrentPage(1); // Reset to first page
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-gray-500">
                        Showing {documents.length} of{" "}
                        {paginationData.itemsTotal || 0} documents
                      </span>
                    </div>
                    <TablePagination
                      currentPage={paginationData.curPage || currentPage}
                      totalPages={paginationData.pageTotal || 1}
                      onPageChange={(page) => setCurrentPage(page)}
                    />
                  </div>
                </div>
              )}
          </>
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
