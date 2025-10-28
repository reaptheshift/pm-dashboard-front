"use client";

import { logout } from "@/app/login/_actions";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  async function handleLogout() {
    try {
      // Use server action for logout
      await logout();

      // This line won't be reached because redirect() throws
      toast.success("Successfully logged out");
    } catch (error: any) {
      // Only show error if it's not a redirect
      if (error.message !== "NEXT_REDIRECT") {
        toast.error("Logout failed", {
          description: "There was an error logging out. Please try again.",
        });
      }
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label="Logout"
    >
      <LogOut className="w-4 h-4 text-gray-500" />
    </button>
  );
}
