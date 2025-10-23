"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const router = useRouter();
  const { isLoading } = useAuth();

  useEffect(() => {
    // Since middleware handles route protection, we can simply redirect
    // The middleware will check for the AuthToken cookie and redirect appropriately
    if (!isLoading) {
      // Check if we have an auth token in cookies
      const hasAuthToken = document.cookie.includes("AuthToken=");

      if (hasAuthToken) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [router, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center justify-center">
        <div className="border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin w-8 h-8"></div>
      </div>
    </div>
  );
}
