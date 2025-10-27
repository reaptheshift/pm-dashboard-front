"use client";

import * as React from "react";
import { useHash } from "@/hooks/useHash";
import { DocumentsContent } from "../_documents/DocumentsContent";
import { ProjectsContent } from "../_projects/ProjectsContent";
import { UserContent } from "../_users/UserContent";
import { IntegrationsContent } from "../../../_integrations/IntegrationsContent";

function Placeholder({ title }: { title: string }) {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-900">{title}</h1>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <p className="text-gray-600">{title} content will appear here.</p>
      </div>
    </div>
  );
}

export function TabRouter() {
  const { hash } = useHash("#Documents");
  const [isHydrated, setIsHydrated] = React.useState(false);

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

  // Show default content until hydrated to prevent hydration mismatch
  if (!isHydrated) {
    return <DocumentsContent />;
  }

  return (
    <>
      {/* Render all tabs but only show the active one */}
      <div className={activeTab === "documents" ? "block" : "hidden"}>
        <DocumentsContent />
      </div>

      <div className={activeTab === "projects" ? "block" : "hidden"}>
        <ProjectsContent />
      </div>

      <div className={activeTab === "users" ? "block" : "hidden"}>
        <UserContent />
      </div>

      <div className={activeTab === "integrations" ? "block" : "hidden"}>
        <IntegrationsContent />
      </div>

      <div className={activeTab === "ai" ? "block" : "hidden"}>
        <Placeholder title="AI assistant" />
      </div>

      <div className={activeTab === "logs" ? "block" : "hidden"}>
        <Placeholder title="System Logs" />
      </div>

      <div className={activeTab === "settings" ? "block" : "hidden"}>
        <Placeholder title="Settings" />
      </div>

      <div className={activeTab === "dashboard" ? "block" : "hidden"}>
        <Placeholder title="Dashboard" />
      </div>
    </>
  );
}

export default TabRouter;
