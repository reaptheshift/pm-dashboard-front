import * as React from "react";
import Image from "next/image";

export interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AuthHeader({
  title = "Log in",
  subtitle = "Welcome back. Enter your credentials to continue.",
}: AuthHeaderProps) {
  return (
    <header className="mb-8 text-center md:text-left">
      {/* PocketBoss Logo */}
      <div className="mb-6 flex justify-center md:justify-start">
        <Image
          src="/images/pockeboss-logo.svg"
          alt="PocketBoss Logo"
          width={120}
          height={40}
          className="h-10 w-auto"
        />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
    </header>
  );
}

export default AuthHeader;
