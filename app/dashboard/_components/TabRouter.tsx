"use client";

import * as React from "react";
import { useHash } from "@/hooks/useHash";
import { DocumentsContent } from "./_documents/DocumentsContent";
import { ProjectsContent } from "./_projects/ProjectsContent";

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

  switch (hash) {
    case "#Dashboard":
      return <Placeholder title="Dashboard" />;
    case "#Projects":
      return <ProjectsContent />;
    case "#Users":
      return <Placeholder title="Users" />;
    case "#Integrations":
      return <Placeholder title="Integrations" />;
    case "#AI":
      return <Placeholder title="AI assistant" />;
    case "#SystemLogs":
      return <Placeholder title="System Logs" />;
    case "#Settings":
      return <Placeholder title="Settings" />;
    case "#Documents":
    default:
      return <DocumentsContent />;
  }
}

export default TabRouter;
