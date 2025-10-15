"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface UniversalPopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UniversalPopover({
  trigger,
  children,
  className,
  contentClassName,
  align = "center",
  side = "bottom",
  sideOffset = 4,
  open,
  onOpenChange,
}: UniversalPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <Popover open={open ?? isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild className={className}>
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          {trigger}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-auto p-0", contentClassName)}
        align={align}
        side={side}
        sideOffset={sideOffset}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

// Common popover variants for different use cases
interface InfoPopoverProps {
  trigger: React.ReactNode;
  title?: string;
  description: string | React.ReactNode;
  className?: string;
}

export function InfoPopover({
  trigger,
  title,
  description,
  className,
}: InfoPopoverProps) {
  return (
    <UniversalPopover trigger={trigger} className={className}>
      <div className="p-4 space-y-2">
        {title && (
          <h4 className="font-medium text-sm text-gray-900">{title}</h4>
        )}
        {typeof description === "string" ? (
          <p className="text-sm text-gray-600">{description}</p>
        ) : (
          <div className="text-sm text-gray-600">{description}</div>
        )}
      </div>
    </UniversalPopover>
  );
}

interface ActionPopoverProps {
  trigger: React.ReactNode;
  actions: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "destructive";
  }>;
  className?: string;
}

export function ActionPopover({
  trigger,
  actions,
  className,
}: ActionPopoverProps) {
  return (
    <UniversalPopover trigger={trigger} className={className}>
      <div className="py-2">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={cn(
              "w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 transition-colors",
              action.variant === "destructive" && "text-red-600 hover:bg-red-50"
            )}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </UniversalPopover>
  );
}

interface MenuPopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function MenuPopover({
  trigger,
  children,
  className,
}: MenuPopoverProps) {
  return (
    <UniversalPopover
      trigger={trigger}
      className={className}
      contentClassName="min-w-[200px]"
    >
      <div className="py-2">{children}</div>
    </UniversalPopover>
  );
}
