"use server";

import { redirect } from "next/navigation";
import { setAuthToken, clearAuthToken } from "@/lib/auth-server";

export async function loginWithCredentials(credentials: {
  email: string;
  password: string;
}) {
  // Direct fetch to Xano API
  const response = await fetch(
    "https://xtvj-bihp-mh8d.n7e.xano.io/api:S2o1M6n7/auth/login",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    }
  );

  const responseBody = await response.json();

  if (response.ok && responseBody?.authToken) {
    // Set the auth token in cookies
    await setAuthToken(responseBody.authToken);

    // Redirect to dashboard - this throws NEXT_REDIRECT
    redirect("/dashboard");
  } else {
    // Handle login failure
    throw new Error(responseBody?.message || "Invalid credentials");
  }
}

export async function logout() {
  // Clear the auth token from cookies
  await clearAuthToken();

  // Redirect to login page with success message
  redirect("/login?logout=success");
}
