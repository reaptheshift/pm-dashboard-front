/**
 * Client-Side Authentication Service
 * Uses API routes for authentication
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  authToken?: string;
  user?: User;
  error?: string;
}

export const authService = {
  // Login user with email and password
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          authToken: result.authToken,
          user: result.user,
        };
      }

      return {
        success: false,
        error: result.error || "Login failed",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Login failed",
      };
    }
  },

  // Check if user is authenticated
  checkAuth: async (): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> => {
    try {
      const response = await fetch("/api/auth/me");
      const result = await response.json();

      if (result.success && result.user) {
        return {
          success: true,
          user: result.user,
        };
      }

      return {
        success: false,
        error: result.error || "Not authenticated",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Auth check failed",
      };
    }
  },

  // Logout user
  logout: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const result = await response.json();

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || "Logout failed",
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Logout failed",
      };
    }
  },
};
