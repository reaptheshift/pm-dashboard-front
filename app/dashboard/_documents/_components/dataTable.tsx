"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileTypeIcon, FileType } from "./fileTypeIcon";
import { StatusBadge, StatusType } from "./statusBadge";
import { ActionButtons } from "./actionButtons";
import { TablePagination } from "./tablePagination";
import { InfoPopover } from "./universalPopover";
import { Badge } from "@/components/ui/badge";

export interface TableRowData {
  id: string;
  fileName: string;
  status: string;
  fileType: FileType;
  size: string;
  uploaded: string;
  parsingStatus: StatusType;
  projectName?: string;
}

interface DataTableProps {
  data: TableRowData[];
  className?: string;
  onDelete?: (fileId: string, fileName: string) => void;
  onFileClick?: (fileId: string) => void;
}

export function DataTable({ data, className, onDelete, onFileClick }: DataTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  // Helper function to truncate filename
  const truncateFileName = (
    fileName: string | undefined,
    maxLength: number = 20
  ) => {
    if (!fileName) return "Unnamed file";
    if (fileName.length <= maxLength) return fileName;
    return fileName.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={cn(
        "bg-white border border-gray-200 rounded-xl shadow-sm",
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="border-b border-gray-200 hover:bg-transparent">
            <TableHead className="px-6 py-3 text-left font-medium text-gray-600 text-xs h-12">
              Name Doc
            </TableHead>
            <TableHead className="px-6 py-3 text-left font-medium text-gray-600 text-xs h-12">
              Parsing Status
            </TableHead>
            <TableHead className="px-6 py-3 text-left font-medium text-gray-600 text-xs h-12">
              Project
            </TableHead>
            <TableHead className="px-6 py-3 text-left font-medium text-gray-600 text-xs h-12">
              Type
            </TableHead>
            <TableHead className="px-6 py-3 text-left font-medium text-gray-600 text-xs h-12">
              Size
            </TableHead>
            <TableHead className="px-6 py-3 text-left font-medium text-gray-600 text-xs h-12">
              Uploaded
            </TableHead>
            <TableHead className="px-6 py-3 text-left font-medium text-gray-600 text-xs h-12">
              {/* Actions column */}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData.map((row, index) => (
            <TableRow
              key={row.id ? row.id : `row-${index}`}
              className={cn(
                "border-b border-gray-200 hover:bg-gray-50/50",
                index % 2 === 0 ? "bg-white" : "bg-gray-50"
              )}
            >
              {/* File Name Column */}
              <TableCell className="px-6 py-4 p-4">
                <div className="flex items-center gap-3">
                  <FileTypeIcon type={row.fileType} />
                  <div className="flex flex-col">
                  {row.fileName && row.fileName.length > 20 ? (
                      <InfoPopover
                        trigger={
                          <span
                            className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log("🔵 DataTable: File name clicked (truncated)", {
                                fileId: row.id,
                                fileName: row.fileName,
                                hasHandler: !!onFileClick,
                              });
                              if (onFileClick) {
                                onFileClick(row.id);
                              }
                            }}
                          >
                            {truncateFileName(row.fileName)}
                          </span>
                        }
                        title="Full Filename"
                        description={row.fileName || "Unnamed file"}
                      />
                    ) : (
                      <span
                        className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("🔵 DataTable: File name clicked (full)", {
                            fileId: row.id,
                            fileName: row.fileName,
                            hasHandler: !!onFileClick,
                          });
                          if (onFileClick) {
                            onFileClick(row.id);
                          }
                        }}
                      >
                        {row.fileName || "Unnamed file"}
                      </span>
                    )}
                    <span className="text-sm text-gray-600">{row.status}</span>
                  </div>
                </div>
              </TableCell>

              {/* Parsing Status Column */}
              <TableCell className="px-6 py-4 p-4">
                <StatusBadge status={row.parsingStatus} />
              </TableCell>

              {/* Project Column */}
              <TableCell className="px-6 py-4 p-4">
                {row.projectName ? (
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                    {row.projectName}
                  </Badge>
                ) : (
                  <Badge className="bg-gray-50 text-gray-700 border-gray-200">
                    No Project
                  </Badge>
                )}
              </TableCell>

              {/* Type Column */}
              <TableCell className="px-6 py-4 p-4">
                <span className="text-sm font-medium text-gray-900">
                  {row.fileType}
                </span>
              </TableCell>

              {/* Size Column */}
              <TableCell className="px-6 py-4 p-4">
                <span className="text-sm font-medium text-gray-900">
                  {row.size}
                </span>
              </TableCell>

              {/* Uploaded Column */}
              <TableCell className="px-6 py-4 p-4">
                <span className="text-sm font-medium text-gray-900">
                  {row.uploaded}
                </span>
              </TableCell>

              {/* Actions Column */}
              <TableCell className="px-4 py-4 p-4">
                <ActionButtons
                  fileName={row.fileName}
                  onDelete={
                    onDelete ? () => onDelete(row.id, row.fileName) : undefined
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
