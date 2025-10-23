"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function IntegrationsContent() {
  const [integrations, setIntegrations] = React.useState([
    {
      id: 1,
      name: "Project Management Integration",
      description: "Connect your project management tools",
      image: "/_integrations/images/integration-card-1.png",
      connected: false,
    },
    {
      id: 2,
      name: "Document Management System",
      description: "Sync documents across platforms",
      image: "/_integrations/images/integration-card-2.svg",
      connected: true,
    },
  ]);

  const handleConnectIntegration = (id: number) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, connected: !integration.connected }
          : integration
      )
    );
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Integrations</h1>
          <p className="text-gray-600 mt-2">
            Connect your favorite tools and services to streamline your workflow
          </p>
        </div>
        <Button className="bg-gray-900 text-white hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" />
          Connect Project
        </Button>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-gray-50 border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Integration Image */}
              <div className="w-full h-20 flex items-center justify-center">
                <Image
                  src={integration.image}
                  alt={integration.name}
                  width={400}
                  height={80}
                  className="max-w-full max-h-full object-contain"
                />
              </div>

              {/* Integration Details */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {integration.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {integration.description}
                </p>
              </div>

              {/* Connect Button */}
              <Button
                onClick={() => handleConnectIntegration(integration.id)}
                variant={integration.connected ? "outline" : "default"}
                className={
                  integration.connected
                    ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                    : "bg-gray-900 text-white hover:bg-gray-800"
                }
              >
                {integration.connected ? "Disconnect" : "Connect"}
              </Button>
            </div>
          </div>
        ))}

        {/* Add New Integration Card */}
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 shadow-sm hover:border-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="flex flex-col items-center justify-center text-center space-y-4 h-full min-h-[200px]">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <Plus className="w-6 h-6 text-gray-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Add Integration
              </h3>
              <p className="text-sm text-gray-600">
                Connect a new service or tool
              </p>
            </div>
            <Button variant="outline" className="border-gray-300 text-gray-700">
              Browse Integrations
            </Button>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Integration Status
        </h2>
        <div className="space-y-3">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${
                    integration.connected ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-sm font-medium text-gray-900">
                  {integration.name}
                </span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  integration.connected
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {integration.connected ? "Connected" : "Not Connected"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IntegrationsContent;
