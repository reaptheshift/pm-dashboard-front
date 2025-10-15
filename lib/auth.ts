// Client-side authentication - no server imports needed

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: number;
  // Allow for additional fields from API
  [key: string]: any;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  error?: string;
}

/**
 * Check if user is authenticated by validating the auth token
 */
export async function checkAuth(): Promise<AuthResponse> {
  // For local development/testing, bypass authentication
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    return {
      success: true,
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        created_at: Date.now()
      }
    };
  }

  try {
    // Get auth token from document.cookie (client-side)
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const authToken = getCookie("AuthToken");

    if (!authToken) {
      return { success: false, error: "No authentication token found" };
    }

    // Validate token with Xano API
    const response = await fetch(
      "https://xtvj-bihp-mh8d.n7e.xano.io/api:S2o1M6n7/auth/me",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const apiUser = await response.json();

    if (response.status === 200 && apiUser) {
      // Map API response to our User interface
      const user: User = {
        id: apiUser.id || apiUser.user_id || 0,
        name:
          apiUser.name ||
          apiUser.full_name ||
          apiUser.first_name + " " + apiUser.last_name ||
          "User",
        email: apiUser.email || apiUser.email_address || "",
        created_at: apiUser.created_at || apiUser.createdAt || Date.now(),
        ...apiUser, // Include any additional fields
      };

      return { success: true, user };
    } else {
      return { success: false, error: "Invalid authentication token" };
    }
  } catch (error: any) {
    console.error("Auth check error:", error.message);
    return { success: false, error: "Authentication check failed" };
  }
}

/**
  * Simple login function for pm-dashboard
 * In production, this would integrate with your authentication system
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    // For development, accept any credentials
    if (process.env.NODE_ENV === 'development' || process.env.BYPASS_AUTH === 'true') {
      const user: User = {
        id: 1,
        name: email.split('@')[0],
        email: email,
        created_at: Date.now()
      };

      // Store session in localStorage
      if (typeof window !== 'undefined') {
        const session = {
          user,
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        localStorage.setItem('pm-dashboard-session', JSON.stringify(session));
      }

      return { success: true, user };
    }

    // In production, implement your authentication logic here
    // This could be a call to your authentication service
    return { success: false, error: "Authentication not implemented for production" };
  } catch (error: any) {
    console.error("Login error:", error.message);
    return { success: false, error: "Login failed" };
  }
}

/**
 * Logout function
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pm-dashboard-session');
  }
}

// Server-side functions removed - using client-side authentication only
