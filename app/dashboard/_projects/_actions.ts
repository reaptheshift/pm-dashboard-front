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

    // If there's an image, try FormData approach with project_image parameter
    if (data.image && typeof data.image === "string") {
      console.log("🔍 API Create - Processing image with FormData");
      console.log("🔍 API Create - Image data length:", data.image.length);
      console.log("🔍 API Create - Image starts with:", data.image.substring(0, 50));

      try {
        // Convert base64 to blob
        const base64Data = data.image;
        const response = await fetch(base64Data);
        const blob = await response.blob();
        
        console.log("🔍 API Create - Blob created, size:", blob.size, "type:", blob.type);

        // Create FormData
        const formData = new FormData();
        
        // Add all non-image fields to FormData
        Object.entries(data).forEach(([key, value]) => {
          if (key !== "image" && value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        // Add image with correct parameter name
        formData.append("project_image", blob, "project-image.jpg");
        
        console.log("🔍 API Create - FormData created with project_image parameter");

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
          console.error("🔍 API Create - FormData Error response:", apiResponse.status, apiResponse.statusText);
          console.error("🔍 API Create - FormData Error data:", errorData);
          throw new Error(
            errorData.message || `Failed to create project: ${apiResponse.statusText}`
          );
        }

        const project = (await apiResponse.json()) as Project;
        console.log("🔍 API Create - FormData Success response:", project);
        return project;
        
      } catch (imageError) {
        console.error("🔍 API Create - FormData image processing error:", imageError);
        console.log("🔍 API Create - Falling back to JSON without image");
        
        // Fall back to JSON without image
        const { image: _, ...dataWithoutImage } = data;
      }
    }

    // Regular JSON request (either no image or fallback)
    const requestData: any = {
      name: data.name,
      description: data.description || null,
      location: data.location || null,
      status: data.status || "active",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
    };

    console.log("🔍 API Create - Final JSON request data:", requestData);

    const response = await fetch(`${XANO_BASE_URL}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("🔍 API Create - JSON Error response:", response.status, response.statusText);
      console.error("🔍 API Create - JSON Error data:", errorData);
      throw new Error(
        errorData.message || `Failed to create project: ${response.statusText}`
      );
    }

    const project = (await response.json()) as Project;
    console.log("🔍 API Create - JSON Success response:", project);
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

    // If there's an image, try FormData approach with project_image parameter
    if (cleanData.image && typeof cleanData.image === "string") {
      console.log("🔍 API Update - Processing image with FormData");
      console.log("🔍 API Update - Image data length:", cleanData.image.length);
      console.log("🔍 API Update - Image starts with:", cleanData.image.substring(0, 50));

      try {
        // Convert base64 to blob
        const base64Data = cleanData.image;
        const response = await fetch(base64Data);
        const blob = await response.blob();
        
        console.log("🔍 API Update - Blob created, size:", blob.size, "type:", blob.type);

        // Create FormData
        const formData = new FormData();
        
        // Add all non-image fields to FormData
        Object.entries(cleanData).forEach(([key, value]) => {
          if (key !== "image" && value !== null && value !== undefined) {
            formData.append(key, value.toString());
          }
        });

        // Add image with correct parameter name
        formData.append("project_image", blob, "project-image.jpg");
        
        console.log("🔍 API Update - FormData created with project_image parameter");

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
          console.error("🔍 API Update - FormData Error response:", apiResponse.status, apiResponse.statusText);
          console.error("🔍 API Update - FormData Error data:", errorData);
          
          throw new Error(
            errorData.message || `Failed to update project: ${apiResponse.statusText}`
          );
        }

        const project = (await apiResponse.json()) as Project;
        console.log("🔍 API Update - FormData Success response:", project);
        return project;
        
      } catch (imageError) {
        console.error("🔍 API Update - FormData image processing error:", imageError);
        console.log("🔍 API Update - Falling back to JSON without image");
        
        // Fall back to JSON without image
        delete cleanData.image;
      }
    }

    // Regular JSON request (either no image or fallback)
    const requestData: any = {
      name: cleanData.name,
      description: cleanData.description || null,
      location: cleanData.location || null,
      status: cleanData.status || "active",
      start_date: cleanData.start_date || null,
      end_date: cleanData.end_date || null,
      modified_at: Date.now(),
    };

    console.log("🔍 API Update - Final JSON request data:", requestData);

    const response = await fetch(`${XANO_BASE_URL}/projects/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(
        "🔍 API Update - JSON Error response:",
        response.status,
        response.statusText
      );
      console.error("🔍 API Update - JSON Error data:", errorData);

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
    console.log("🔍 API Update - JSON Success response:", project);
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
