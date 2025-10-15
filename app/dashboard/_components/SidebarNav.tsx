"use client";

import * as React from "react";
import { useHash } from "@/hooks/useHash";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  FileText,
  Plug,
  MessageSquare,
  Activity,
  Settings,
} from "lucide-react";

const LINKS = [
  { label: "Dashboard", hash: "#Dashboard", Icon: LayoutDashboard },
  { label: "Projects", hash: "#Projects", Icon: FolderKanban },
  { label: "Users", hash: "#Users", Icon: Users },
  { label: "Documents", hash: "#Documents", Icon: FileText },
  { label: "Integrations", hash: "#Integrations", Icon: Plug },
  { label: "AI assistant", hash: "#AI", Icon: MessageSquare },
  { label: "System Logs", hash: "#SystemLogs", Icon: Activity },
  { label: "Settings", hash: "#Settings", Icon: Settings },
] as const;

export function SidebarNav() {
  const { hash, setHash } = useHash("#Documents");
  return (
    <nav className="flex-1 p-4">
      <div className="space-y-1">
        {LINKS.map((link) => {
          const isActive = hash === link.hash;
          const base =
            "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors text-sm";
          const active = "text-white bg-gray-900 hover:bg-gray-800";
          const inactive = "text-gray-700 hover:bg-gray-50";

          return (
            <a
              key={link.hash}
              href={link.hash}
              onClick={(e) => {
                e.preventDefault();
                setHash(link.hash);
              }}
              aria-current={isActive ? "page" : undefined}
              className={`${base} ${isActive ? active : inactive}`}
            >
              <link.Icon className="w-5 h-5" aria-hidden />
              <span>{link.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
