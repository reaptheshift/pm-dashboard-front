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
 * Get Procore token info to verify connection status
 * Uses the Procore auth token (from cookies) to check if integration is active
 */
export async function getProcoreTokenInfo(): Promise<{
  connected: boolean;
  [key: string]: any;
}> {
  try {
    const procoreToken = await getProcoreAuthToken();

    if (!procoreToken) {
      console.log("🔍 getProcoreTokenInfo: No Procore token in cookies");
      return { connected: false };
    }

    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    // Build URL with token as query parameter
    const url = new URL(`${PROCORE_API_URL}/token/info`);
    url.searchParams.set("token", procoreToken);

    console.log("🔍 Calling token/info endpoint:", {
      url: url.toString(),
      hasProcoreToken: !!procoreToken,
      procoreTokenLength: procoreToken?.length || 0,
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-cache",
    });

    console.log("🔍 token/info response:", {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    });

    if (!response.ok) {
      let errorText = "";
      try {
        errorText = await response.text();
      } catch (e) {
        // Ignore text parsing errors
      }

      // Try to parse as JSON if possible
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        // Not JSON, use as plain text
      }

      console.error("❌ token/info error:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        errorJson,
      });

      // If 401 or 403, token is invalid
      if (response.status === 401 || response.status === 403) {
        return {
          connected: false,
          error: errorJson?.message || errorText || "Unauthorized",
          status: response.status,
        };
      }

      // For other errors, return false but include error info
      return {
        connected: false,
        error: errorJson?.message || errorText || `HTTP ${response.status}`,
        status: response.status,
      };
    }

    let data;
    try {
      const responseText = await response.text();
      console.log("🔍 token/info raw response:", responseText);
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error("❌ Failed to parse token/info response:", e);
      return { connected: false, error: "Invalid response format" };
    }

    console.log("✅ token/info success:", data);

    // Consider connected if we get any valid response (even empty object)
    // The API might return different structures
    return { connected: true, ...data };
  } catch (error: any) {
    console.error("❌ getProcoreTokenInfo error:", error.message);
    // On error, assume not connected
    return { connected: false };
  }
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
