"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SimpleDeleteDialog } from "./simpleDialogs";
import { Trash2 } from "lucide-react";

interface ActionButtonsProps {
  onDelete?: () => void;
  fileName?: string;
  className?: string;
}

export function ActionButtons({
  onDelete,
  fileName = "this item",
  className,
}: ActionButtonsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Delete Button */}
      <SimpleDeleteDialog
        trigger={
          <button
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        }
        fileName={fileName}
        onDelete={onDelete || (() => {})}
      />
    </div>
  );
}
