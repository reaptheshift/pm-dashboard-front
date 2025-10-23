"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface ServerUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("AuthToken")?.value || null;
}

export async function setAuthToken(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("AuthToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
  });
}

export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("AuthToken");
}

export async function checkServerAuth(): Promise<ServerUser | null> {
  const token = await getAuthToken();

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(
      "https://xtvj-bihp-mh8d.n7e.xano.io/api:S2o1M6n7/auth/me",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const body = await response.json();
      return body.user || body;
    }
  } catch (error) {
    // Silent fail
  }

  return null;
}

export async function requireAuth(): Promise<ServerUser> {
  const user = await checkServerAuth();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function optionalAuth(): Promise<ServerUser | null> {
  return await checkServerAuth();
}
