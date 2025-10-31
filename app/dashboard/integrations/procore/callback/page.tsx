"use client";

import { useEffect } from "react";

export default function ProcoreCallbackPage() {
  useEffect(() => {
    // Get the authorization code from URL query params
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    // If there's an error, send error message to parent
    if (error) {
      window.opener?.postMessage(
        {
          type: "PROCORE_OAUTH_ERROR",
          error: error,
          error_description: errorDescription || "Authorization failed",
        },
        window.location.origin
      );
      window.close();
      return;
    }

    // If we have a code, send it to the parent window
    if (code) {
      window.opener?.postMessage(
        {
          type: "PROCORE_OAUTH_SUCCESS",
          code: code,
        },
        window.location.origin
      );
    } else {
      // No code received
      window.opener?.postMessage(
        {
          type: "PROCORE_OAUTH_ERROR",
          error: "no_code",
          error_description: "No authorization code received",
        },
        window.location.origin
      );
    }

    // Close the popup window
    setTimeout(() => {
      window.close();
    }, 100);
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing authorization...</p>
      </div>
    </div>
  );
}

