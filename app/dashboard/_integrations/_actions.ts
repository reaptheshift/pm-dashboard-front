"use server";

import { getAuthToken } from "@/lib/auth-server";

// Procore integration endpoint
const PROCORE_API_URL =
  "https://xtvj-bihp-mh8d.n7e.xano.io/api:CcHPK_bl/procore";

/**
 * Authorize Procore integration
 * Initiates OAuth flow and returns authorization URL
 */
export async function authorizeProcore(): Promise<string> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${PROCORE_API_URL}/authorize`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Failed to get Procore authorization URL: ${response.status}${
          errorText ? ` - ${errorText}` : ""
        }`
      );
    }

    const data = await response.json();

    // Handle different response formats
    const authUrl =
      typeof data === "string"
        ? data
        : data?.authUrl || data?.url || data?.authorization_url || "";

    if (!authUrl) {
      throw new Error("No authorization URL returned from server");
    }

    return authUrl;
  } catch (error: any) {
    throw new Error(error.message || "Failed to authorize Procore integration");
  }
}

/**
 * Exchange authorization code for access token
 * Called after user authorizes the app in Procore
 */
export async function exchangeProcoreToken(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${PROCORE_API_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ code }),
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Failed to exchange token: ${response.status}${
          errorText ? ` - ${errorText}` : ""
        }`
      );
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    throw new Error(
      error.message || "Failed to exchange Procore authorization code"
    );
  }
}
