"use server";

import {
  type AuthProvider,
  type Credentials,
  type AuthResult,
  type AuthSuccessResult,
  type AuthErrorResult,
} from "./_types";
import { XanoClient, XanoObjectStorage } from "@xano/js-sdk";

export async function loginWithCredentials(
  credentials: Credentials
): Promise<AuthSuccessResult | AuthErrorResult> {
  try {
    const xano = new XanoClient({
      apiGroupBaseUrl: "https://xtvj-bihp-mh8d.n7e.xano.io/api:S2o1M6n7",
      storage: new XanoObjectStorage(),
    });
    const response = await xano.post("/auth/login", {
      email: credentials.email,
      password: credentials.password,
    });

    // Get response data using Xano's getBody() method
    const responseBody = response.getBody();
    const statusCode = response.getStatusCode();
    const headers = response.getHeaders();

    console.log("Login response:", {
      statusCode,
      headers,
      body: responseBody,
    });

    // Check if we have a valid auth token in the response
    if (responseBody?.authToken) {
      // Set the auth token using Xano's built-in method
      xano.setAuthToken(responseBody.authToken);

      // Verify the token was set correctly
      if (xano.hasAuthToken()) {
        return {
          success: true,
          message: "Login successful",
          meta: { authToken: responseBody.authToken, statusCode },
        };
      } else {
        return {
          success: false,
          message: "Failed to set authentication token",
          meta: { statusCode: 500 }, // Internal server error
        };
      }
    } else {
      // No auth token in response - this could be various error cases
      // Return the actual status code from the server
      return {
        success: false,
        message: responseBody?.message || "Invalid credentials",
        meta: { statusCode },
      };
    }
  } catch (error: any) {
    console.error("Login error:", error);

    // Handle XanoRequestError specifically
    if (error.getResponse) {
      const xanoHttpResponse = error.getResponse();
      const errorBody = xanoHttpResponse.getBody();
      const errorStatusCode = xanoHttpResponse.getStatusCode();
      const errorHeaders = xanoHttpResponse.getHeaders();

      console.error("Xano error details:", {
        message: error.message,
        statusCode: errorStatusCode,
        headers: errorHeaders,
        body: errorBody,
      });

      return {
        success: false,
        message: errorBody?.message || `Login failed (${errorStatusCode})`,
        meta: { statusCode: errorStatusCode },
      };
    }

    return {
      success: false,
      message: "Login failed. Please try again.",
      meta: { statusCode: 500 }, // Internal server error for unexpected errors
    };
  }
}

export async function loginWithProvider(
  _provider: AuthProvider
): Promise<AuthResult> {
  // Placeholder: integrate with OAuth/Xano later
  return { success: true };
}
