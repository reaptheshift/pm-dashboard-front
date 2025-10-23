"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function IntegrationsContent() {
  const [isConnected, setIsConnected] = React.useState(false);

  const handleConnectProcore = () => {
    setIsConnected(!isConnected);
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
      </div>

      {/* Procore Integration Box */}
      <div className="max-w-md mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Procore Logo */}
            <div className="w-32 h-16 flex items-center justify-center">
              <Image
                src="/images/procore-logo.svg"
                alt="Procore Logo"
                width={128}
                height={64}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnectProcore}
              variant={isConnected ? "outline" : "default"}
              className={
                isConnected
                  ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                  : "bg-gray-900 text-white hover:bg-gray-800"
              }
            >
              {isConnected ? "Disconnect" : "Connect to Procore"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntegrationsContent;
