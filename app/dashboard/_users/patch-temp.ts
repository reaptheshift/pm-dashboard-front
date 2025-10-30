"use client";

import type { FieldWorker, UpdateFieldWorkerData } from "./_actions";

const XANO_BASE_URL = "https://xtvj-bihp-mh8d.n7e.xano.io/api:hRRjrmcb";

/**
 * Client-side helper to get auth token from cookies
 * Note: httpOnly cookies won't be accessible, but this can help diagnose
 */
function getAuthTokenFromClient(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  try {
    const cookies = document.cookie.split(";");
    const authCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("AuthToken=")
    );

    if (authCookie) {
      return authCookie.split("=")[1]?.trim() || null;
    }
  } catch (error) {
    console.warn("⚠️ getAuthTokenFromClient - Failed to read cookies:", error);
  }

  return null;
}

/**
 * Client-side patch function for updating a user
 * This is for debugging purposes - client-side rendered for better diagnosis
 *
 * @param user_id - The ID of the user to update
 * @param userData - The user data to update
 * @param authToken - Optional auth token. If not provided, will attempt to get from cookies
 * @returns The updated user data
 */
export async function patchUserClient(
  user_id: number,
  userData: UpdateFieldWorkerData,
  authToken?: string
): Promise<FieldWorker> {
  console.group("🔷 patchUserClient - CLIENT SIDE PATCH");
  console.log("📥 Received params:", { user_id, userData });
  console.log("📥 Auth token provided:", authToken ? "Yes" : "No");

  try {
    // Try to get token if not provided
    let token: string | undefined = authToken;

    if (!token) {
      console.log("🔍 Attempting to get token from cookies...");
      token = getAuthTokenFromClient() ?? undefined;
      console.log(
        "🔍 Token from cookies:",
        token ? `${token.substring(0, 20)}...` : "Not found"
      );
    }

    if (!token) {
      throw new Error(
        "Authentication required. Token not provided and not found in cookies. Note: httpOnly cookies may not be accessible from client-side."
      );
    }

    // Extract projects if provided
    const { projects, modified_at, ...userDataWithoutProjects } = userData;

    // Build update data
    // Note: Some backends handle modified_at automatically, but Xano might expect it
    const updateData: any = {
      ...userDataWithoutProjects,
    };

    // Only add modified_at if not provided and if backend requires it
    // Xano typically handles this automatically, but including it for consistency
    if (!modified_at) {
      updateData.modified_at = Date.now();
    } else {
      updateData.modified_at = modified_at;
    }

    // Handle projects - match server action logic exactly
    // Only include projects if it's an array with items (same as server action)
    if (projects && Array.isArray(projects) && projects.length > 0) {
      updateData.projects = projects;
      console.log("✅ Projects included in update (non-empty array)");
    } else {
      console.log(
        "ℹ️ Projects not included - either not provided, not array, or empty"
      );
      if (projects !== undefined) {
        console.log("  - projects value:", projects);
        console.log("  - is array:", Array.isArray(projects));
        console.log("  - length:", projects?.length);
      }
    }

    console.log("📦 Projects in userData:", projects);
    console.log("📦 Projects type:", typeof projects);
    console.log("📦 Projects is array:", Array.isArray(projects));
    console.log("📦 Projects length:", projects?.length);

    // Log the raw object structure (what backend will receive as parsed JSON)
    console.log("📦 RAW JSON OBJECT (what backend receives):", updateData);

    // Log the keys
    console.log("📦 Update data keys:", Object.keys(updateData));

    // Stringify for sending (this is what gets sent in the HTTP body)
    const requestBody = JSON.stringify(updateData);

    // Log the JSON string (the actual bytes sent to backend)
    console.log("📦 JSON STRING (raw HTTP body that will be sent):");
    console.log(requestBody);

    // Also log it pretty-printed for readability
    console.log("📦 JSON STRING (pretty-printed for readability):");
    console.log(JSON.stringify(updateData, null, 2));

    console.log("🌐 API URL:", `${XANO_BASE_URL}/field_workers/${user_id}`);

    const requestOptions = {
      method: "PATCH" as const,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    };

    console.log("📤 Request details:", {
      method: requestOptions.method, // PATCH
      url: `${XANO_BASE_URL}/field_workers/${user_id}`,
      headers: {
        Authorization: `Bearer ${token.substring(0, 20)}...`,
        "Content-Type": requestOptions.headers["Content-Type"],
      },
      bodyLength: requestBody.length,
      bodyBytes: new TextEncoder().encode(requestBody).length,
    });

    // Show exact JSON that backend will parse
    console.log("🔍 Exact JSON payload (copy-paste to test):");
    console.log(JSON.stringify(updateData));

    console.time("⏱️ Fetch duration");
    const response = await fetch(
      `${XANO_BASE_URL}/field_workers/${user_id}`,
      requestOptions
    );
    console.timeEnd("⏱️ Fetch duration");

    console.log("📥 Response status:", response.status);
    console.log("📥 Response ok:", response.ok);
    console.log("📥 Response statusText:", response.statusText);
    const responseHeadersLog: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      responseHeadersLog[key] = value
    })
    console.log("📥 Response headers:", responseHeadersLog)

    if (!response.ok) {
      let errorData = {};
      let errorText = "";
      let errorHeaders = {};

      try {
        // Clone response to read text without consuming the stream
        const responseClone = response.clone();
        errorText = await responseClone.text();
        console.error("❌ Error response text (raw):", errorText);
        console.error("❌ Error response text length:", errorText.length);
        console.error(
          "❌ Error response text (first 500 chars):",
          errorText.substring(0, 500)
        );

        // Try to parse as JSON
        if (
          errorText.trim().startsWith("{") ||
          errorText.trim().startsWith("[")
        ) {
          try {
            errorData = JSON.parse(errorText);
            console.error("❌ Error response data (parsed JSON):", errorData);
          } catch (parseError) {
            console.error("❌ Failed to parse as JSON:", parseError);
          }
        } else {
          console.error("❌ Response is not JSON format");
        }

        // Log all headers
        const errorHeadersLog: Record<string, string> = {}
        response.headers.forEach((value, key) => {
          errorHeadersLog[key] = value
        })
        errorHeaders = errorHeadersLog
        console.error("❌ Response headers:", errorHeaders);
      } catch (e) {
        console.error("❌ Failed to read error response:", e);
      }

      console.error("❌ Full error details:", {
        status: response.status,
        statusText: response.statusText,
        headers: errorHeaders,
        bodyText: errorText,
        bodyData: errorData,
      });

      const errorMessage =
        (errorData as any)?.message ||
        (errorData as any)?.error ||
        errorText ||
        `Failed to update user: ${response.statusText} (${response.status})`;

      console.error("❌ Final error message:", errorMessage);

      // Additional diagnostics for 500 errors
      if (response.status === 500) {
        console.error("🔍 DIAGNOSTIC: 500 Internal Server Error detected");
        console.error(
          "🔍 This usually indicates a backend issue. Possible causes:"
        );
        console.error("  - Backend validation failure");
        console.error("  - Database constraint violation");
        console.error("  - Permission issue");
        console.error("  - Xano backend configuration issue");
        console.error(
          "🔍 Suggestion: Check Xano backend logs for more details"
        );
        console.error(
          "🔍 Suggestion: Try the same request from the server action to compare"
        );
      }

      console.groupEnd();
      throw new Error(errorMessage);
    }

    let updatedUser: FieldWorker;

    try {
      const responseText = await response.text();
      console.log("📥 Response text:", responseText);

      try {
        updatedUser = JSON.parse(responseText);
        console.log("✅ Successfully parsed response:", updatedUser);
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        console.error("❌ Raw response:", responseText);
        throw new Error(
          `Invalid JSON response from server: ${responseText.substring(0, 200)}`
        );
      }
    } catch (responseError: any) {
      console.error("❌ Failed to read response:", responseError);
      throw new Error(
        responseError.message || "Failed to read response from server"
      );
    }

    console.log("✅ updateUser - Successfully updated user:", updatedUser);
    console.log("✅ updateUser - User ID:", updatedUser.id);
    console.log("✅ updateUser - User name:", updatedUser.name);
    console.log("✅ updateUser - User email:", updatedUser.email);
    console.log(
      "✅ updateUser - Projects relations:",
      updatedUser.projects_relations || updatedUser.project_relations
    );

    console.groupEnd();
    return updatedUser;
  } catch (error: any) {
    console.error("❌ patchUserClient - Catch block error:", error);
    console.error("❌ patchUserClient - Error name:", error.name);
    console.error("❌ patchUserClient - Error message:", error.message);
    console.error("❌ patchUserClient - Error stack:", error.stack);
    console.groupEnd();

    // Re-throw with original message or generic error
    throw new Error(error.message || "Failed to update user");
  }
}
