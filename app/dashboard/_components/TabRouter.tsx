"use client";

import * as React from "react";
import { useHash } from "@/hooks/useHash";
import dynamic from "next/dynamic";

// Lazy load tab components - only load when needed
const DocumentsContent = dynamic(
  () => import("../_documents/DocumentsContent").then((mod) => ({ default: mod.DocumentsContent })),
  { loading: () => <div className="p-6">Loading documents...</div> }
);

const ProjectsContent = dynamic(
  () => import("../_projects/ProjectsContent").then((mod) => ({ default: mod.ProjectsContent })),
  { loading: () => <div className="p-6">Loading projects...</div> }
);

const UserContent = dynamic(
  () => import("../_users/UserContent").then((mod) => ({ default: mod.UserContent })),
  { loading: () => <div className="p-6">Loading users...</div> }
);

const IntegrationsContent = dynamic(
  () => import("../_integrations/IntegrationsContent").then((mod) => ({ default: mod.IntegrationsContent })),
  { loading: () => <div className="p-6">Loading integrations...</div> }
);

const AssistantContent = dynamic(
  () => import("../_assistant/AssistantContent").then((mod) => ({ default: mod.AssistantContent })),
  { loading: () => <div className="p-6">Loading assistant...</div> }
);

export function TabRouter() {
  const { hash } = useHash("#Documents");
  const [isHydrated, setIsHydrated] = React.useState(false);
  const [loadedTabs, setLoadedTabs] = React.useState<Set<string>>(new Set(["documents"]));

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Determine which tab is active
  const getActiveTab = () => {
    if (!isHydrated) return "documents";
    if (hash === "#Documents" || hash === "") return "documents";
    if (hash === "#Projects") return "projects";
    if (hash === "#Users") return "users";
    if (hash === "#Integrations") return "integrations";
    if (hash === "#AI") return "ai";
    if (hash === "#SystemLogs") return "logs";
    if (hash === "#Settings") return "settings";
    if (hash === "#Dashboard") return "dashboard";
    return "documents";
  };

  const activeTab = getActiveTab();

  // Mark tab as loaded when it becomes active
  React.useEffect(() => {
    if (activeTab && !loadedTabs.has(activeTab)) {
      setLoadedTabs((prev) => new Set([...prev, activeTab]));
    }
  }, [activeTab, loadedTabs]);

  // Show default content until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return <DocumentsContent />;
  }

  return (
    <>
      {/* Only render tabs that have been loaded */}
      {loadedTabs.has("documents") && (
        <div
          className={`${activeTab === "documents" ? "block" : "hidden"} h-full`}
        >
          <DocumentsContent />
        </div>
      )}

      {loadedTabs.has("projects") && (
        <div
          className={`${activeTab === "projects" ? "block" : "hidden"} h-full`}
        >
          <ProjectsContent />
        </div>
      )}

      {loadedTabs.has("users") && (
        <div className={`${activeTab === "users" ? "block" : "hidden"} h-full`}>
          <UserContent />
        </div>
      )}

      {loadedTabs.has("integrations") && (
        <div
          className={`${
            activeTab === "integrations" ? "block" : "hidden"
          } h-full`}
        >
          <IntegrationsContent />
        </div>
      )}

      {loadedTabs.has("ai") && (
        <div className={`${activeTab === "ai" ? "block" : "hidden"} h-full`}>
          <AssistantContent />
        </div>
      )}
    </>
  );
}

export default TabRouter;
