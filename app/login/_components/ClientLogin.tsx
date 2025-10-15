"use client";

import * as React from "react";
import AuthHeader from "./AuthHeader";
import LoginForm, { type LoginFormValues } from "./LoginForm";
import { loginWithCredentials } from "../_actions";
import { toast } from "sonner";

export default function ClientLogin() {
  // Check for logout success message on component mount
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("logout") === "success") {
      toast.info("Successfully logged out", {
        description: "You have been logged out of your account",
      });

      // Clean up the URL by removing the query parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);
  async function handleFormSubmit(values: LoginFormValues) {
    try {
      // Use server action for login
      await loginWithCredentials({
        email: values.email,
        password: values.password,
      });

      // This line won't be reached because redirect() throws
      toast.success("Login successful", {
        description: "Welcome back! Redirecting to dashboard...",
      });
    } catch (error: any) {
      // Only show error if it's not a redirect
      if (error.message !== "NEXT_REDIRECT") {
        toast.error("Login failed", {
          description: error.message || "Invalid credentials",
        });
      }
    }
  }

  return (
    <React.Fragment>
      <AuthHeader />
      <div className="space-y-6">
        <LoginForm onSubmit={handleFormSubmit} />

        <p className="text-center text-xs text-gray-500">
          By continuing, you agree to our{" "}
          <a className="underline" href="#">
            Terms
          </a>{" "}
          and{" "}
          <a className="underline" href="#">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </React.Fragment>
  );
}
