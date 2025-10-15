"use client";

import * as React from "react";
import AuthHeader from "./AuthHeader";
import LoginForm, { type LoginFormValues } from "./LoginForm";
import { loginWithCredentials } from "../_actions";
import { XanoClient, XanoCookieStorage } from "@xano/js-sdk";
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
      const result = await loginWithCredentials({
        email: values.email,
        password: values.password,
      });

      if (result.success && result.meta?.authToken) {
        // Show success toast
        toast.success("Login successful", {
          description: "Welcome back! Redirecting to dashboard...",
        });

        // Create Xano client and set the auth token
        const xano = new XanoClient({
          apiGroupBaseUrl: "https://xtvj-bihp-mh8d.n7e.xano.io/api:S2o1M6n7",
          storage: new XanoCookieStorage(),
        });

        // Set the auth token in Xano client (this will automatically set the cookie)
        xano.setAuthToken(result.meta.authToken);

        // Verify the token is set and redirect
        if (xano.hasAuthToken()) {
          setTimeout(() => {
            window.location.href = "/dashboard";
          }, 1000);
        } else {
          toast.error("Authentication error", {
            description: "Failed to set authentication token",
          });
        }
      } else {
        // Show error toast
        toast.error("Login failed", {
          description: result.message || "Invalid credentials",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An unexpected error occurred", {
        description: "Please try again.",
      });
    }
  }

  return (
    <React.Fragment>
      <AuthHeader />
      <div className="space-y-6">
        <LoginForm onSubmit={handleFormSubmit} />

        {/* Test Auth Button */}
        <div className="flex justify-center">
          <button
            onClick={async () => {
              try {
                // Get auth token from cookies (Xano uses "AuthToken" with capital A)
                const authToken = document.cookie
                  .split(";")
                  .find((c) => c.trim().startsWith("AuthToken="))
                  ?.split("=")[1];

                if (!authToken) {
                  toast.error("No Auth Token", {
                    description: "Please login first to get an auth token",
                  });
                  return;
                }

                // Call /auth/me directly
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

                const data = await response.json();

                if (response.ok && data) {
                  toast.success("Auth Test Successful!", {
                    description: `User: ${data.name || "Unknown"}`,
                  });
                } else {
                  toast.error("Auth Test Failed", {
                    description: data.message || "Unknown error",
                  });
                }
              } catch (error: any) {
                toast.error("Auth Test Error", {
                  description: error.message || "Network error",
                });
              }
            }}
            className="px-4 py-2 bg-purple-500 text-white rounded text-sm hover:bg-purple-600 transition-colors"
          >
            Test /auth/me
          </button>
        </div>

        {/* Toast Test Buttons */}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={() =>
              toast.success("Success!", {
                description: "This is a success message",
              })
            }
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
          >
            Test Success
          </button>
          <button
            onClick={() =>
              toast.error("Error!", { description: "This is an error message" })
            }
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
          >
            Test Error
          </button>
          <button
            onClick={() =>
              toast.warning("Warning!", {
                description: "This is a warning message",
              })
            }
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors"
          >
            Test Warning
          </button>
          <button
            onClick={() =>
              toast.info("Info!", { description: "This is an info message" })
            }
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Test Info
          </button>
        </div>

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
