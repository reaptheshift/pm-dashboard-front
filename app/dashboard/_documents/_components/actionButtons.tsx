"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SimpleDeleteDialog } from "./simpleDialogs";
import { Trash2 } from "lucide-react";

interface ActionButtonsProps {
  onDelete?: () => void;
  fileName?: string;
  className?: string;
  disabled?: boolean;
}

export function ActionButtons({
  onDelete,
  fileName = "this item",
  className,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Delete Button */}
      {disabled ? (
        <button
          className="flex items-center justify-center w-10 h-10 rounded-lg opacity-40 cursor-not-allowed"
          aria-label="Delete disabled while processing"
          disabled
          title="Delete disabled while processing"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      ) : (
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
      )}
    </div>
  );
}
