export type StatusType = "completed" | "processing" | "failed" | "uploaded";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X } from "lucide-react";

interface StatusBadgeProps {
  status: StatusType;
}

const statusConfig = {
  completed: {
    variant: "success" as const,
    icon: Check,
    label: "Completed",
  },
  processing: {
    variant: "info" as const,
    icon: Loader2,
    label: "Processing",
  },
  failed: {
    variant: "danger" as const,
    icon: X,
    label: "Failed",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig];
  return (
    <Badge
      variant={
        config.variant as "success" | "warning" | "default" | "info" | "danger"
      }
      className="flex items-center gap-1 w-fit"
    >
      {config.icon && (
        <config.icon
          className={`w-3 h-3 ${status === "processing" ? "animate-spin" : ""}`}
        />
      )}
      {config.label.charAt(0).toUpperCase() + config.label.slice(1)}
    </Badge>
  );
}
