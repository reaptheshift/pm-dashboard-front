import * as React from "react";
import AuthLayout from "./_components/AuthLayout";
import ClientLogin from "./_components/ClientLogin";

export default function LoginPage() {
  return (
    <AuthLayout>
      <ClientLogin />
    </AuthLayout>
  );
}
