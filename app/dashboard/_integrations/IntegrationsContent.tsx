"use client";

import * as React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { authorizeProcore } from "./_actions";
import { useProcoreOAuth } from "./useProcoreOAuth";
import { toast } from "sonner";

export function IntegrationsContent() {
  const [isConnecting, setIsConnecting] = React.useState(false);

  // Handle OAuth callback - automatically detects code in URL and initiates
  const { isConnecting: isOAuthConnecting, isConnected } = useProcoreOAuth();

  const handleConnectProcore = async () => {
    try {
      setIsConnecting(true);

      // Authorize Procore connection
      const authUrl = await authorizeProcore();

      if (!authUrl) {
        throw new Error("No authorization URL returned");
      }

      // Open OAuth popup window
      const popup = window.open(
        authUrl,
        "Procore Login",
        "width=600,height=700,left=100,top=100"
      );

      if (!popup) {
        toast.error("Popup blocked", {
          description: "Please allow popups to connect to Procore",
        });
        setIsConnecting(false);
        return;
      }

      // Monitor popup closure (in case user closes without completing)
      // The message handler will handle success/error states
      // If user closes popup manually, we'll reset state after a delay
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setTimeout(() => {
            setIsConnecting(false);
          }, 500);
        }
      }, 1000);
    } catch (error: any) {
      toast.error("Failed to connect to Procore", {
        description:
          error.message || "There was an error connecting to Procore",
      });
      setIsConnecting(false);
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

      {/* Available Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Procore Integration Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center">
                <Image
                  src="/images/procore-logo.svg"
                  alt="Procore"
                  width={56}
                  height={56}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Procore
                  </h3>
                  {isConnected && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Construction project management
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Sync Features:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Projects and project data</li>
                  <li>• Documents and files</li>
                  <li>• Contacts and vendors</li>
                  <li>• Financial information</li>
                </ul>
              </div>
              {isConnected ? (
                <div className="w-full bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-green-700">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="font-medium">Connected to Procore</span>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleConnectProcore}
                  disabled={isConnecting || isOAuthConnecting}
                  className="w-full bg-gray-900 text-white hover:bg-gray-800"
                >
                  {isConnecting || isOAuthConnecting
                    ? "Connecting..."
                    : "Connect to Procore"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Coming Soon Cards */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm opacity-60">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  More Integrations
                </h3>
                <p className="text-sm text-gray-600 mt-1">Coming soon</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Additional integrations are on the way. Stay tuned!
            </p>
            <Button
              disabled
              className="w-full bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              Coming Soon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default IntegrationsContent;
