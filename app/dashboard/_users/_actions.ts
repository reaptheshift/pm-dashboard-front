"use server";

import { getAuthToken } from "@/lib/auth-server";

const XANO_BASE_URL = "https://xtvj-bihp-mh8d.n7e.xano.io/api:hRRjrmcb";

export interface User {
  id: number;
  created_at: number;
  modified_at: number;
  last_login: number;
  name: string;
  email: string;
  role: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  modified_at?: number;
}

// Get all users
export async function getUsers(): Promise<User[]> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${XANO_BASE_URL}/users`, {
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
export async function createUser(userData: CreateUserData): Promise<User> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${XANO_BASE_URL}/users`, {
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
  userData: UpdateUserData
): Promise<User> {
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
