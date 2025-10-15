"use client";

import * as React from "react";
import { Users, Activity, CheckCircle } from "lucide-react";

interface UsersMetricsCardsProps {
  totalUsers: number;
  activeUsers: number;
  invitedUsers: number;
  inactiveUsers: number;
}

export function UsersMetricsCards({
  totalUsers,
  activeUsers,
  invitedUsers,
  inactiveUsers,
}: UsersMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Total Users
            </p>
            <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Active Users
            </p>
            <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
          </div>
          <div className="w-12 h-12 bg-green-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
            <Activity className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Pending/Invited
            </p>
            <p className="text-2xl font-bold text-gray-900">{invitedUsers}</p>
          </div>
          <div className="w-12 h-12 bg-yellow-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
            <CheckCircle className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">
              Inactive Users
            </p>
            <p className="text-2xl font-bold text-gray-900">{inactiveUsers}</p>
          </div>
          <div className="w-12 h-12 bg-red-50 border border-gray-200 rounded-lg flex items-center justify-center shadow-sm">
            <Users className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsersMetricsCards;
