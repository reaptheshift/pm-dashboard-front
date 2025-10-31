"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { initiateProcore, getProcoreTokenInfo } from "./_actions";
import { toast } from "sonner";

/**
 * Custom hook to handle Procore OAuth callback
 * Detects authorization code in URL and initiates the OAuth flow
 * Also checks connection status on mount
 */
export function useProcoreOAuth() {
  const hasInitiatedRef = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Check connection status on mount
  useEffect(() => {
    async function checkConnection() {
      try {
        const tokenInfo = await getProcoreTokenInfo();
        setIsConnected(tokenInfo.connected);
      } catch (error) {
        setIsConnected(false);
      }
    }

    checkConnection();
  }, []);

  const handleOAuthCallback = useCallback(async (code: string) => {
    // Prevent duplicate calls
    if (hasInitiatedRef.current) {
      return;
    }

    hasInitiatedRef.current = true;

    try {
      setIsConnecting(true);

      // Call initiate endpoint with the authorization code
      const result = await initiateProcore(code);

      console.log("✅ Procore initiate result:", {
        success: result.success,
        hasAccessToken: !!result.access_token,
        hasRefreshToken: !!result.refresh_token,
      });

      // Wait a moment for cookies to be set before verification
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Verify connection by calling token/info endpoint
      const tokenInfo = await getProcoreTokenInfo();

      console.log("🔍 Token info verification:", {
        connected: tokenInfo.connected,
        tokenInfoKeys: Object.keys(tokenInfo),
      });

      if (tokenInfo.connected) {
        setIsConnected(true);
        toast.success("Procore connected successfully!", {
          description: "Your Procore account has been connected",
        });
      } else {
        // Show more detailed error message
        const errorDetails = tokenInfo.error || tokenInfo.message || "Unknown error";
        console.error("⚠️ Verification failed details:", tokenInfo);
        toast.warning("Connection initiated but verification failed", {
          description: errorDetails || "Please refresh the page to check connection status",
        });
      }

      // Clean up URL by removing the code parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("code");
      window.history.replaceState({}, "", url.toString());

      setIsConnecting(false);
    } catch (error: any) {
      toast.error("Failed to complete connection", {
        description: error.message || "Failed to initiate Procore integration",
      });
      setIsConnecting(false);
      // Reset ref on error so user can retry
      hasInitiatedRef.current = false;
    }
  }, []);

  // Check for OAuth callback code in URL when component mounts - only once
  useEffect(() => {
    // Skip if already initiated
    if (hasInitiatedRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      handleOAuthCallback(code);
    }
  }, [handleOAuthCallback]);

  return { isConnecting, isConnected, setIsConnected };
}

