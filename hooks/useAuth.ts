"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/app/login/_actions";

export interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        // Since we don't have API routes, we'll check auth status
        // by making a request to a server component or using a different approach
        // For now, we'll assume the middleware handles route protection
        setIsLoading(false);
      } catch (error) {
        // Auth check failed, user is not authenticated
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      router.push("/login");
    } catch (error) {
      // Logout failed, but still redirect to login
      router.push("/login");
    }
  };

  return {
    user,
    isLoading,
    logout: handleLogout,
    isAuthenticated: !!user,
  };
}
