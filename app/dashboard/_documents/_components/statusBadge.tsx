import * as React from "react";
import { cn } from "@/lib/utils";

export type StatusType = "completed" | "processing" | "failed" | "uploaded";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig = {
  completed: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    dotColor: "bg-green-500",
    label: "Completed",
  },
  processing: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dotColor: "bg-blue-500",
    label: "Processing",
  },
  uploaded: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    text: "text-yellow-700",
    dotColor: "bg-yellow-500",
    label: "Uploaded",
  },
  failed: {
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    dotColor: "bg-red-500",
    label: "Failed",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.uploaded; // Fallback to uploaded if status not found

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-medium border",
        config.bg,
        config.border,
        config.text,
        className
      )}
    >
      <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
      {config.label}
    </span>
  );
}
