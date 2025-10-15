"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/auth-client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const authResult = await authService.checkAuth();

        if (authResult.success && authResult.user) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard");
        } else {
          // User is not authenticated, redirect to login
          router.push("/login");
        }
      } catch (error) {
        router.push("/login");
      }
    };

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex items-center justify-center">
        <div className="border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin w-8 h-8"></div>
      </div>
    </div>
  );
}
