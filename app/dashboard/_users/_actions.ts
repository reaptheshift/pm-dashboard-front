"use server";

import { getAuthToken } from "@/lib/auth-server";

const XANO_BASE_URL = "https://xtvj-bihp-mh8d.n7e.xano.io/api:hRRjrmcb";

export interface Project {
  id: number;
  creator_id: number;
  name: string;
  description: string;
  location: string;
  start_date: string; // date as string
  end_date: string; // date as string
  status: string; // enum as string
  modified_at: number;
  created_at: number;
  image: string; // image URL or path
}

export interface FieldWorker {
  id: number;
  created_at: number;
  modified_at: number;
  last_login: number;
  name: string;
  email: string;
  role: string;
  projects: Project[];
}
export interface CreateFieldWorkerData {
  name: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateFieldWorkerData {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  modified_at?: number;
}

// Get all users
export async function getFieldWorkers(): Promise<FieldWorker[]> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${XANO_BASE_URL}/field_workers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }

    const users = await response.json();
    return users;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch users");
  }
}

// Create a new user
export async function createFieldWorker(
  userData: CreateFieldWorkerData
): Promise<FieldWorker> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${XANO_BASE_URL}/field_workers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to create user: ${response.statusText}`
      );
    }

    const newUser = await response.json();
    return newUser;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create user");
  }
}

// Update a user
export async function updateUser(
  userId: number,
  userData: UpdateFieldWorkerData
): Promise<FieldWorker> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    // Always include modified_at with current timestamp
    const updateData = {
      ...userData,
      modified_at: Date.now(),
    };

    const response = await fetch(`${XANO_BASE_URL}/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to update user: ${response.statusText}`
      );
    }

    const updatedUser = await response.json();
    return updatedUser;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update user");
  }
}
