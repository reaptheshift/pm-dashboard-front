"use server";

import { getAuthToken } from "@/lib/auth-server";

const XANO_BASE_URL = "https://xtvj-bihp-mh8d.n7e.xano.io/api:CcHPK_bl";

// Authorize Procore connection
export async function authorizeProcore(): Promise<{
  authUrl: string;
  url?: string;
}> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${XANO_BASE_URL}/procore/authorize`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || "Failed to authorize Procore connection"
      );
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(error.message || "Failed to authorize Procore connection");
  }
}
