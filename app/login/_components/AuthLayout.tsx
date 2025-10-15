"use client";

import * as React from "react";
import Image from "next/image";

export interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh w-full bg-white md:grid md:grid-cols-2">
      <section className="flex min-h-dvh items-center justify-center px-6 py-10 sm:px-8 md:px-12">
        <div className="w-full max-w-md">{children}</div>
      </section>
      <aside className="relative hidden min-h-dvh md:block bg-[#0C111D] overflow-hidden">
        {/* Top-right corner SVG */}
        <div className="absolute top-0 right-0 w-64 h-40 opacity-30">
          <Image
            src="/images/line-pattern.svg"
            alt="Login Image"
            width={258}
            height={152}
          />
        </div>

        {/* Bottom-left corner SVG */}
        <div className="absolute bottom-0 left-0 w-64 h-40 opacity-30">
          <Image
            src="/images/line-pattern.svg"
            alt="Login Image"
            width={258}
            height={152}
          />
        </div>

        {/* Dashboard mockup content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 py-16">
          {/* Mockup cards */}
          <Image
            src="/images/dashboard.svg"
            alt="Login Image"
            width={500}
            height={500}
          />

          {/* Text content */}
          <div className="text-center text-white mb-8">
            <h2 className="text-xl font-medium mb-2">
              Welcome to your new dashboard
            </h2>
            <p className="text-base font-medium text-purple-200">
              Sign in to explore changes we've made.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
export default AuthLayout;
