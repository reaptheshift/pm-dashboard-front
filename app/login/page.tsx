import * as React from "react";
import AuthLayout from "./_components/AuthLayout";
import ClientLogin from "./_components/ClientLogin";
import { optionalAuth } from "@/lib/auth-server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await optionalAuth();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthLayout>
      <ClientLogin />
    </AuthLayout>
  );
}
