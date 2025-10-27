"use server";

import { getAuthToken } from "@/lib/auth-server";

const XANO_BASE_URL = "https://xtvj-bihp-mh8d.n7e.xano.io/api:O2ncQBcv";

export interface ProcoreConnection {
  id: number;
  user_id: number;
  company_id: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  connected_at: number;
  is_active: boolean;
}

export interface ProcoreCompany {
  id: string;
  name: string;
  logo?: string;
  timezone?: string;
}

// Initialize Procore OAuth connection
export async function initiateProcoreConnection(): Promise<{
  authUrl: string;
  state: string;
}> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${XANO_BASE_URL}/integrations/procore/initiate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Failed to initiate Procore connection"
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to initiate Procore connection");
  }
}

// Complete OAuth callback
export async function completeProcoreConnection(
  code: string,
  state: string
): Promise<{ success: boolean; connection: ProcoreConnection }> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${XANO_BASE_URL}/integrations/procore/callback`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, state }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Failed to complete Procore connection"
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to complete Procore connection");
  }
}

// Get current Procore connection status
export async function getProcoreConnection(): Promise<ProcoreConnection | null> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${XANO_BASE_URL}/integrations/procore/status`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // If no connection exists, return null
      if (response.status === 404) {
        return null;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Failed to get Procore connection status"
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to get Procore connection status");
  }
}

// Disconnect Procore integration
export async function disconnectProcore(): Promise<void> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${XANO_BASE_URL}/integrations/procore/disconnect`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to disconnect from Procore");
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to disconnect from Procore");
  }
}

// Refresh Procore access token
export async function refreshProcoreToken(): Promise<{
  access_token: string;
  expires_at: number;
}> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${XANO_BASE_URL}/integrations/procore/refresh`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to refresh Procore token");
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to refresh Procore token");
  }
}

// Get Procore companies (organizations the user has access to)
export async function getProcoreCompanies(): Promise<ProcoreCompany[]> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${XANO_BASE_URL}/integrations/procore/companies`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to get Procore companies");
    }

    const data = await response.json();
    return data.companies || [];
  } catch (error: any) {
    throw new Error(error.message || "Failed to get Procore companies");
  }
}

// Sync Procore projects
export async function syncProcoreProjects(): Promise<{
  success: boolean;
  projectsSynced: number;
}> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${XANO_BASE_URL}/integrations/procore/sync-projects`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to sync Procore projects");
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to sync Procore projects");
  }
}

// Test Procore connection
export async function testProcoreConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${XANO_BASE_URL}/integrations/procore/test`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to test Procore connection");
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to test Procore connection");
  }
}
