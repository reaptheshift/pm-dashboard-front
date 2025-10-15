import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { NavigationLoader } from "@/components/ui/navigationLoader";

export const metadata: Metadata = {
  title: "PocketBoss Admin",
  description: "Admin and PM login",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-background font-sans antialiased">
        <NavigationLoader />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
