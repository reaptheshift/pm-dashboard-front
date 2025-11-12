import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { getFileTypeFromExtension, type FileType } from "@/lib/file-utils";

export type { FileType };
export { getFileTypeFromExtension };

interface FileTypeIconProps {
  type: FileType;
  className?: string;
}

const fileTypeConfig = {
  DOC: {
    svg: "/images/docx-icon.svg",
    bg: "bg-blue-600",
    label: "DOC",
  },
  PDF: {
    svg: "/images/pdf-icon.svg",
    bg: "bg-red-600",
    label: "PDF",
  },
  CSV: {
    svg: "/images/csv-icon.svg",
    bg: "bg-green-600",
    label: "CSV",
  },
  PPTX: {
    svg: "/images/docx-icon.svg", // Using DOCX icon as fallback for PPTX
    bg: "bg-orange-600",
    label: "PPTX",
  },
  XLS: {
    svg: "/images/csv-icon.svg", // Using CSV icon as fallback for XLS
    bg: "bg-green-600",
    label: "XLS",
  },
};

export function FileTypeIcon({ type, className }: FileTypeIconProps) {
  const config = fileTypeConfig[type];

  return (
    <div className={cn("w-10 h-10", className)}>
      {/* SVG Icon */}
      <Image
        src={config.svg}
        alt={`${type} file icon`}
        width={40}
        height={40}
        className="w-full h-full object-contain"
      />
    </div>
  );
}
