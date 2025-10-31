"use server";

import { cookies } from "next/headers";
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
 * Set Procore auth token in cookies
 */
async function setProcoreAuthToken(
  token: string,
  expiresIn?: number
): Promise<void> {
  const cookieStore = await cookies();
  // expiresIn is in seconds from Procore API
  // maxAge is also in seconds for cookies
  const maxAge = expiresIn || 60 * 60 * 24 * 30; // Default to 30 days if no expiry

  cookieStore.set("procoreAuthToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
  });
}

/**
 * Get Procore auth token from cookies
 */
export async function getProcoreAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("procoreAuthToken")?.value || null;
}

/**
 * Set Procore refresh token in cookies
 */
async function setProcoreRefreshToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("procoreRefreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year for refresh token
  });
}

/**
 * Initiate Procore OAuth flow with authorization code
 * Called after user authorizes the app in Procore and is redirected back
 */
export async function initiateProcore(code: string): Promise<{
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${PROCORE_API_URL}/initiate`, {
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
        `Failed to initiate Procore: ${response.status}${
          errorText ? ` - ${errorText}` : ""
        }`
      );
    }

    const data = await response.json();

    // Parse nested response structure: response.result.access_token
    const result = data?.response?.result || data?.result || data;
    const accessToken = result?.access_token;
    const refreshToken = result?.refresh_token;
    const expiresIn = result?.expires_in;

    if (!accessToken) {
      throw new Error("No access token received from Procore");
    }

    // Save access token to cookies
    await setProcoreAuthToken(accessToken, expiresIn);

    // Save refresh token to cookies if available
    if (refreshToken) {
      await setProcoreRefreshToken(refreshToken);
    }

    return {
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to initiate Procore integration");
  }
}

/**
 * Refresh Procore access token using refresh token
 * Call this when the access token expires
 */
export async function refreshProcoreToken(): Promise<{
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("procoreRefreshToken")?.value;

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${PROCORE_API_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-cache",
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Failed to refresh Procore token: ${response.status}${
          errorText ? ` - ${errorText}` : ""
        }`
      );
    }

    const data = await response.json();

    // Parse nested response structure
    const result = data?.response?.result || data?.result || data;
    const accessToken = result?.access_token;
    const newRefreshToken = result?.refresh_token || refreshToken; // Keep old if new not provided
    const expiresIn = result?.expires_in;

    if (!accessToken) {
      throw new Error("No access token received from refresh");
    }

    // Update cookies with new tokens
    await setProcoreAuthToken(accessToken, expiresIn);
    if (newRefreshToken !== refreshToken) {
      await setProcoreRefreshToken(newRefreshToken);
    }

    return {
      success: true,
      access_token: accessToken,
      refresh_token: newRefreshToken,
      expires_in: expiresIn,
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to refresh Procore token");
  }
}
