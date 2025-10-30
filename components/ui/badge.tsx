import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "info" | "danger";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseClasses =
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2";

  const variantClasses = {
    default: "border-gray-300 bg-gray-100 bg-opacity-10 text-gray-500",
    success: "border-green-300 bg-green-500 bg-opacity-10 text-green-600",
    warning: "border-yellow-300 bg-yellow-500 bg-opacity-10 text-yellow-600",
    info: "border-blue-300 bg-blue-500 bg-opacity-10 text-blue-600",
    danger: "border-red-300 bg-red-500 bg-opacity-10 text-red-600",
  };

  return (
    <span
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  );
}

export { Badge };
