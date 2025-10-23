"use server";

import { getAuthToken } from "@/lib/auth-server";

const XANO_BASE_URL = "https://xtvj-bihp-mh8d.n7e.xano.io/api:QionVWA4";

export interface Project {
  id: number;
  creator_id: number;
  name: string;
  description: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  modified_at: number;
  created_at: number;
  image: string | { url: string } | null;
}

export interface CreateProjectData {
  name: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  project_image?: string | null; // base64 string
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  project_image?: string | null; // base64 string
  modified_at?: number; // timestamp
}

// Fetch all projects
export async function getProjects(): Promise<Project[]> {
  try {
    const authToken = await getAuthToken();

    const response = await fetch(`${XANO_BASE_URL}/projects`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const projects = (await response.json()) as Project[];
    return projects;
  } catch (error: any) {
    throw new Error(error.message || "Failed to fetch projects");
  }
}

// Create a new project
export async function createProject(data: CreateProjectData): Promise<Project> {
  try {
    const authToken = await getAuthToken();

    const response = await fetch(`${XANO_BASE_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to create project: ${response.statusText}`
      );
    }

    const project = (await response.json()) as Project;
    return project;
  } catch (error: any) {
    throw new Error(error.message || "Failed to create project");
  }
}

// Update an existing project
export async function updateProject(
  id: number,
  data: UpdateProjectData
): Promise<Project> {
  try {
    const authToken = await getAuthToken();

    const response = await fetch(`${XANO_BASE_URL}/projects/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to update project: ${response.statusText}`
      );
    }

    const project = (await response.json()) as Project;
    return project;
  } catch (error: any) {
    throw new Error(error.message || "Failed to update project");
  }
}

// Delete a project
export async function deleteProject(id: number): Promise<void> {
  try {
    const authToken = await getAuthToken();

    const response = await fetch(`${XANO_BASE_URL}/projects/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to delete project: ${response.statusText}`
      );
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to delete project");
  }
}
