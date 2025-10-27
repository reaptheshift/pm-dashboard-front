"use client";

import { useState, useEffect, useMemo } from "react";
import { useHash } from "@/hooks/useHash";
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
import { getDocuments, deleteDocument as deleteDoc } from "./_actions";
import type { Document } from "./_actions";

export function DocumentsContent() {
  const { hash } = useHash("#Documents");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Delete document function
  const deleteDocument = async (fileId: string, fileName: string) => {
    try {
      await deleteDoc(fileId);

      // Remove from local state immediately for better UX
      setDocuments((prev) => prev.filter((doc) => doc.fileId !== fileId));
    } catch (error) {
      setError(`Failed to delete ${fileName}. Please try again.`);
    }
  };

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
      category: "Technical doc",
      tags: [
        { label: "Materials", color: "blue" as const },
        { label: "Construction", color: "indigo" as const },
      ],
      size: formatFileSize(doc.fileSize),
      uploaded: new Date(doc.uploadTimestamp).toLocaleDateString("en-GB"),
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

          <UploadDocumentModalWrapper onUploadComplete={handleRefresh}>
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
          <DataTable data={tableData} onDelete={deleteDocument} />
        ))}
    </div>
  );
}

export default DocumentsContent;
