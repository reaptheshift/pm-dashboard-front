"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  try {
    // Clear the auth token cookie
    const cookieStore = await cookies();
    cookieStore.delete("AuthToken");
  } catch (error) {
    console.error("Error clearing auth cookie:", error);
    // Continue with redirect even if cookie clearing fails
  }

  // Redirect to login page with success message
  redirect("/login?logout=success");
}
