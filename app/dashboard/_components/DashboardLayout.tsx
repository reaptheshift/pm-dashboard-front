import * as React from "react";
import Image from "next/image";
import { ServerUser } from "@/lib/auth-server";
import { LogoutButton } from "./LogoutButton";
import { SidebarNav } from "./SidebarNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: ServerUser;
}

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col fixed h-screen top-0 left-0 z-10">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <Image
            src="/images/pockeboss-logo.svg"
            alt="PocketBoss Logo"
            width={120}
            height={40}
            className="h-8 w-auto"
          />
        </div>

        {/* Navigation */}
        <SidebarNav />

        {/* User Account */}
        <div className="px-2 pt-6 pb-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            {/* Avatar and User Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center relative">
                <span className="text-sm font-semibold text-white">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
                {/* Inner border */}
                <div className="absolute inset-0 rounded-full border border-gray-900/8"></div>
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-semibold text-gray-700">
                  {user.name}
                </p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            {/* Logout Button */}
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-72">
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
