"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  initiateProcoreConnection,
  getProcoreConnection,
  disconnectProcore,
} from "../app/dashboard/_integrations/procore/_actions";
import { toast } from "sonner";

export function IntegrationsContent() {
  const [isConnected, setIsConnected] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);

  // Check connection status on mount
  React.useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const connection = await getProcoreConnection();
      setIsConnected(!!connection);
    } catch (error) {
      console.error("Failed to check connection status:", error);
      setIsConnected(false);
    }
  };

  const handleConnectProcore = async () => {
    if (isConnected) {
      // Disconnect
      handleDisconnectProcore();
      return;
    }

    try {
      setIsConnecting(true);

      // Initiate OAuth flow
      const { authUrl } = await initiateProcoreConnection();

      // Redirect to Procore OAuth page
      window.location.href = authUrl;
    } catch (error: any) {
      toast.error("Failed to connect to Procore", {
        description:
          error.message || "There was an error initiating the connection",
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnectProcore = async () => {
    try {
      setIsDisconnecting(true);

      await disconnectProcore();
      setIsConnected(false);

      toast.success("Disconnected from Procore successfully");
    } catch (error: any) {
      toast.error("Failed to disconnect from Procore", {
        description: error.message || "There was an error disconnecting",
      });
    } finally {
      setIsDisconnecting(false);
    }
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
      <div className="w-full">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 shadow-sm hover:shadow-md transition-shadow min-h-[400px] flex items-center justify-center">
          <div className="flex flex-col items-center text-center space-y-8">
            {/* Procore Logo */}
            <div className="w-64 h-32 flex items-center justify-center">
              <Image
                src="/images/procore-logo.svg"
                alt="Procore Logo"
                width={256}
                height={128}
                className="max-w-full max-h-full object-contain"
              />
            </div>

            {/* Connection Status */}
            {isConnected ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-medium">Connected to Procore</span>
                  </div>
                </div>
                <Button
                  onClick={handleDisconnectProcore}
                  variant="outline"
                  disabled={isDisconnecting}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 text-sm max-w-md">
                  Connect your Procore account to sync projects, documents, and
                  data between Procore and PocketBoss.
                </p>
                <Button
                  onClick={handleConnectProcore}
                  disabled={isConnecting}
                  className="bg-gray-900 text-white hover:bg-gray-800"
                >
                  {isConnecting ? "Connecting..." : "Connect to Procore"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntegrationsContent;
