"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { initiateProcore } from "./_actions";
import { toast } from "sonner";

/**
 * Custom hook to handle Procore OAuth callback
 * Detects authorization code in URL and initiates the OAuth flow
 */
export function useProcoreOAuth() {
  const hasInitiatedRef = useRef(false);
  const [isConnecting, setIsConnecting] = useState(false);

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

      // TODO: Store the token data (access_token, refresh_token) in your database
      // You might want to call another API endpoint to save the tokens
      // Example: await saveProcoreTokens(result.access_token, result.refresh_token);
      console.log("Procore initiated successfully:", {
        success: result.success,
        hasAccessToken: !!result.access_token,
        hasRefreshToken: !!result.refresh_token,
      });

      toast.success("Procore connected successfully!", {
        description: "Your Procore account has been connected",
      });

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

  return { isConnecting };
}

