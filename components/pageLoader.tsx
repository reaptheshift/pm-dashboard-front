"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function PageLoader({ className, size = "md" }: PageLoaderProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={cn("flex items-center justify-center p-8", className)}>
      <div className="relative">
        {/* Outer spinning ring */}
        <div
          className={cn(
            "border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin",
            sizeClasses[size]
          )}
        />
        {/* Inner pulsing dot */}
        <div
          className={cn(
            "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2",
            "w-2 h-2 bg-blue-600 rounded-full animate-pulse",
            size === "sm" && "w-1 h-1",
            size === "lg" && "w-3 h-3"
          )}
        />
      </div>
    </div>
  );
}

// Full page loader overlay
export function FullPageLoader() {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <PageLoader size="lg" />
        <p className="text-sm text-gray-600 mt-4 text-center">Loading...</p>
      </div>
    </div>
  );
}
