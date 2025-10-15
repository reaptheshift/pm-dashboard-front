"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth, User } from "@/lib/auth";
import DashboardLayout from "@/app/dashboard/_components/DashboardLayout";
import { TabRouter } from "./_components/TabRouter";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const authResult = await checkAuth();

        if (authResult.success && authResult.user) {
          setUser(authResult.user);
        } else {
          router.push("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    handleAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center justify-center">
          <div className="border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin w-8 h-8"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <DashboardLayout user={user}>
      <TabRouter />
    </DashboardLayout>
  );
}
