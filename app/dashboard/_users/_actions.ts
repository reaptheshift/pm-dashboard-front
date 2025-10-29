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

export interface ProjectRelation {
  project: Project;
  relation_id: number;
}

export interface FieldWorker {
  id: number;
  created_at: number;
  modified_at: number;
  last_login: number | null;
  name: string;
  email: string;
  role: string;
  projects_relations?: ProjectRelation[]; // GET response
  project_relations?: ProjectRelation[]; // PATCH response
}
export interface CreateFieldWorkerData {
  name: string;
  email: string;
  role: string;
  password: string;
  projects?: number[];
}

export interface UpdateFieldWorkerData {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
  projects?: number[];
  modified_at?: number;
}

export interface CreateFieldWorkerResponse {
  user: FieldWorker;
  projects: Project[];
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

    // Validate response structure
    if (!Array.isArray(users)) {
      throw new Error("Invalid response format from server");
    }

    return users;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch users");
  }
}

// Create a new user
export async function createFieldWorker(
  userData: CreateFieldWorkerData
): Promise<CreateFieldWorkerResponse> {
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

    const result = await response.json();

    // Validate response structure
    if (!result || !result.user || typeof result.user.id === "undefined") {
      throw new Error("Invalid response format from server");
    }

    return result;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create user");
  }
}

// Update a user
export async function updateUser(
  user_id: number,
  userData: UpdateFieldWorkerData
): Promise<FieldWorker> {
  console.log("🟣 updateUser - Received params:", { user_id, userData });

  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    // Extract projects if provided
    const { projects, ...userDataWithoutProjects } = userData;

    // Build update data
    const updateData: any = {
      ...userDataWithoutProjects,
      modified_at: Date.now(),
    };

    // Only include projects if it's an array with items
    if (projects && Array.isArray(projects) && projects.length > 0) {
      updateData.projects = projects;
    }

    console.log("🟣 updateUser - Projects in userData:", projects);
    console.log("🟣 updateUser - Update data to send:", updateData);
    console.log("🟣 updateUser - JSON payload:", JSON.stringify(updateData));
    console.log(
      "🟣 updateUser - API URL:",
      `${XANO_BASE_URL}/field_workers/${user_id}`
    );

    const response = await fetch(`${XANO_BASE_URL}/field_workers/${user_id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    console.log("🟣 updateUser - Response status:", response.status);
    console.log("🟣 updateUser - Response ok:", response.ok);

    if (!response.ok) {
      let errorData = {};
      let errorText = "";

      try {
        errorText = await response.text();
        console.error("🟣 updateUser - Error response text:", errorText);
        errorData = JSON.parse(errorText);
        console.error("🟣 updateUser - Error response data:", errorData);
      } catch (e) {
        console.error("🟣 updateUser - Failed to parse error response:", e);
        console.error("🟣 updateUser - Raw error text:", errorText);
      }

      console.error("🟣 updateUser - Response status:", response.status);
      console.error(
        "🟣 updateUser - Response status text:",
        response.statusText
      );

      const errorMessage =
        (errorData as any).message ||
        (errorData as any).error ||
        errorText ||
        `Failed to update user: ${response.statusText} (${response.status})`;
      throw new Error(errorMessage);
    }

    const updatedUser = await response.json();
    console.log("✅ updateUser - Successfully updated user:", updatedUser);
    return updatedUser;
  } catch (error: any) {
    console.error("❌ updateUser - Catch block error:", error);
    console.error("❌ updateUser - Error message:", error.message);
    throw new Error(error.message || "Failed to update user");
  }
}

// Delete a user
export async function deleteUser(userId: number): Promise<void> {
  try {
    const authToken = await getAuthToken();

    if (!authToken) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${XANO_BASE_URL}/field_workers/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete user: ${response.statusText}`
      );
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete user");
  }
}
