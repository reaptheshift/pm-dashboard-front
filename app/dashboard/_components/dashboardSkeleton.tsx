import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="w-12 h-12 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="w-6 h-6" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex flex-col md:flex-row lg:flex-row gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 flex-1" />
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        {/* Table Header */}
        <div className="px-6 py-3 border-b border-gray-200">
          <div className="flex gap-6">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>

        {/* Table Rows */}
        {[...Array(10)].map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="px-6 py-4 border-b border-gray-200 last:border-b-0"
          >
            <div className="flex items-center gap-6">
              {/* File icon and name */}
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>

              {/* Status */}
              <Skeleton className="h-6 w-20" />

              {/* Category */}
              <Skeleton className="h-4 w-24" />

              {/* Tags */}
              <div className="flex gap-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>

              {/* Size */}
              <Skeleton className="h-4 w-12" />

              {/* Uploaded */}
              <Skeleton className="h-4 w-16" />

              {/* Actions */}
              <div className="flex gap-1">
                <Skeleton className="w-10 h-10" />
                <Skeleton className="w-10 h-10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
