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
  image?: string | null; // base64 string
}

export interface UpdateProjectData {
  name?: string;
  description?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  image?: string | null; // base64 string
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

    console.log("🔍 API Create - Data being sent:", data);
    console.log("🔍 API Create - Has image:", !!data.image);

    // If there's an image, use FormData
    if (data.image && typeof data.image === "string") {
      const formData = new FormData();
      
      // Add all non-image fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'image' && value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Convert base64 to blob and add to FormData
      try {
        const base64Data = data.image;
        const response = await fetch(base64Data);
        const blob = await response.blob();
        formData.append('image', blob, 'project-image.jpg');
        
        console.log("🔍 API Create - Using FormData with image blob");
        
        const apiResponse = await fetch(`${XANO_BASE_URL}/projects`, {
          method: "POST",
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            // Don't set Content-Type for FormData, let browser set it with boundary
          },
          body: formData,
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}));
          console.error("🔍 API Create - Error response:", apiResponse.status, apiResponse.statusText);
          console.error("🔍 API Create - Error data:", errorData);
          throw new Error(
            errorData.message || `Failed to create project: ${apiResponse.statusText}`
          );
        }

        const project = (await apiResponse.json()) as Project;
        console.log("🔍 API Create - Success response:", project);
        return project;
        
      } catch (imageError) {
        console.error("🔍 API Create - Image processing error:", imageError);
        // Fall back to regular JSON request without image
        const { image: _, ...dataWithoutImage } = data;
        console.log("🔍 API Create - Falling back to JSON without image");
        
        const response = await fetch(`${XANO_BASE_URL}/projects`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
          },
          body: JSON.stringify(dataWithoutImage),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Failed to create project: ${response.statusText}`
          );
        }

        const project = (await response.json()) as Project;
        return project;
      }
    } else {
      // Regular JSON request (no image)
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
    }
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

    console.log("🔍 API Update - Project ID:", id);
    console.log("🔍 API Update - Data being sent:", data);
    console.log("🔍 API Update - Has image:", !!data.image);

    // Validate project ID
    if (!id || typeof id !== "number") {
      throw new Error("Invalid project ID provided");
    }

    // Clean the data object - remove any undefined values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, value]) => value !== undefined)
    );

    console.log("🔍 API Update - Clean data:", cleanData);

    // If there's an image, we need to handle it differently
    if (cleanData.image && typeof cleanData.image === "string") {
      // For XANO, we might need to use FormData for image uploads
      const formData = new FormData();
      
      // Add all non-image fields to FormData
      Object.entries(cleanData).forEach(([key, value]) => {
        if (key !== 'image' && value !== null && value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      // Convert base64 to blob and add to FormData
      try {
        const base64Data = cleanData.image;
        const response = await fetch(base64Data);
        const blob = await response.blob();
        formData.append('image', blob, 'project-image.jpg');
        
        console.log("🔍 API Update - Using FormData with image blob");
        
        const apiResponse = await fetch(`${XANO_BASE_URL}/projects/${id}`, {
          method: "PATCH",
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            // Don't set Content-Type for FormData, let browser set it with boundary
          },
          body: formData,
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json().catch(() => ({}));
          console.error("🔍 API Update - Error response:", apiResponse.status, apiResponse.statusText);
          console.error("🔍 API Update - Error data:", errorData);
          
          throw new Error(
            errorData.message || `Failed to update project: ${apiResponse.statusText}`
          );
        }

        const project = (await apiResponse.json()) as Project;
        console.log("🔍 API Update - Success response:", project);
        return project;
        
      } catch (imageError) {
        console.error("🔍 API Update - Image processing error:", imageError);
        // Fall back to regular JSON request without image
        delete cleanData.image;
        console.log("🔍 API Update - Falling back to JSON without image");
      }
    }

    // Regular JSON request (either no image or fallback)
    const response = await fetch(`${XANO_BASE_URL}/projects/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(cleanData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "🔍 API Update - Error response:",
        response.status,
        response.statusText
      );
      console.error("🔍 API Update - Error data:", errorData);

      // Provide more specific error messages
      if (response.status === 400) {
        throw new Error(
          errorData.message ||
            "Invalid data provided. Please check your input and try again."
        );
      } else if (response.status === 404) {
        throw new Error("Project not found. It may have been deleted.");
      } else if (response.status === 413) {
        throw new Error(
          "Image file is too large. Please choose a smaller image."
        );
      } else {
        throw new Error(
          errorData.message ||
            `Failed to update project: ${response.statusText}`
        );
      }
    }

    const project = (await response.json()) as Project;
    console.log("🔍 API Update - Success response:", project);
    return project;
  } catch (error: any) {
    console.error("🔍 API Update - Caught error:", error);
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
