"use client";

import * as React from "react";
import { useHash } from "@/hooks/useHash";
import {
  FolderKanban,
  Users,
  FileText,
  Plug,
  MessageSquare,
} from "lucide-react";

const LINKS = [
  { label: "Projects", hash: "#Projects", Icon: FolderKanban },
  { label: "Users", hash: "#Users", Icon: Users },
  { label: "Documents", hash: "#Documents", Icon: FileText },
  { label: "Integrations", hash: "#Integrations", Icon: Plug },
  { label: "Assistant", hash: "#AI", Icon: MessageSquare },
] as const;

export function SidebarNav() {
  const { hash, setHash } = useHash("#Documents");
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <nav className="flex-1 p-4">
      <div className="space-y-1">
        {LINKS.map((link) => {
          const isActive = isHydrated ? hash === link.hash : false;
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
