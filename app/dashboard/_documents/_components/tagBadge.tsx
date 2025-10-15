import * as React from "react";
import { cn } from "@/lib/utils";

export type TagColor = "blue" | "indigo" | "gray";

interface TagBadgeProps {
  children: React.ReactNode;
  color?: TagColor;
  className?: string;
}

const tagColors = {
  blue: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
  },
  indigo: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-700",
  },
  gray: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-700",
  },
};

export function TagBadge({
  children,
  color = "blue",
  className,
}: TagBadgeProps) {
  const colors = tagColors[color];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
        colors.bg,
        colors.border,
        colors.text,
        className
      )}
    >
      {children}
    </span>
  );
}
