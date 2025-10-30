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
  },
  processing: {
    variant: "default" as const,
    icon: Loader2,
  },
  failed: {
    variant: "error" as const,
    icon: X,
  },
  uploaded: {
    variant: "default" as const,
    icon: null,
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.uploaded;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      {Icon && (
        <Icon
          className={`w-3 h-3 ${
            status === "processing" ? "animate-spin" : ""
          }`}
        />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
