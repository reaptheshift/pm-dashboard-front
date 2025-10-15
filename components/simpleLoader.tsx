"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SimpleLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function SimpleLoader({ className, size = "md" }: SimpleLoaderProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin",
          sizeClasses[size]
        )}
      />
    </div>
  );
}
