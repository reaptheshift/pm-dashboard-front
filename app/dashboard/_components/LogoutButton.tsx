"use client";

import { logout } from "../_actions";
import { toast } from "sonner";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  async function handleLogout() {
    try {
      // Call server action to clear cookies and redirect
      await logout();
    } catch (error) {
      // Only show error if it's not a redirect error
      if (error instanceof Error && !error.message.includes("NEXT_REDIRECT")) {
        console.error("Logout error:", error);
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
