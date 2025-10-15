import { DashboardSkeleton } from "./_components/dashboardSkeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar skeleton */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col fixed h-screen top-0 left-0 z-10">
        <div className="p-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-6 bg-gray-200 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content area with skeleton */}
      <div className="ml-72 p-6">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
