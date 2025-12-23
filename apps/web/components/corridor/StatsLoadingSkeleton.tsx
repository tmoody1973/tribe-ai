"use client";

export function StatsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Visa Info Skeleton */}
      <div className="border-4 border-gray-200 bg-gray-100 p-4 shadow-[4px_4px_0_0_#d1d5db]">
        <div className="h-6 w-32 bg-gray-200 mb-4" />
        <div className="space-y-3">
          <div className="h-5 bg-gray-200" />
          <div className="h-5 bg-gray-200" />
          <div className="h-5 bg-gray-200 w-3/4" />
        </div>
      </div>

      {/* Cost Comparison Skeleton */}
      <div className="border-4 border-gray-200 bg-gray-100 p-4 shadow-[4px_4px_0_0_#d1d5db]">
        <div className="h-6 w-48 bg-gray-200 mb-4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200" />
              <div className="h-4 bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Currency Skeleton */}
      <div className="border-4 border-gray-200 bg-gray-100 p-4 shadow-[4px_4px_0_0_#d1d5db]">
        <div className="h-6 w-40 bg-gray-200 mb-4" />
        <div className="h-12 bg-gray-200 mb-4" />
        <div className="flex gap-4">
          <div className="flex-1 h-16 bg-gray-200" />
          <div className="flex-1 h-16 bg-gray-200" />
        </div>
      </div>

      {/* Timezone Skeleton */}
      <div className="border-4 border-gray-200 bg-gray-100 p-4 shadow-[4px_4px_0_0_#d1d5db]">
        <div className="h-6 w-36 bg-gray-200 mb-4" />
        <div className="flex justify-between items-center">
          <div className="text-center space-y-2">
            <div className="h-4 w-20 bg-gray-200 mx-auto" />
            <div className="h-8 w-16 bg-gray-200 mx-auto" />
          </div>
          <div className="h-8 w-24 bg-gray-200" />
          <div className="text-center space-y-2">
            <div className="h-4 w-20 bg-gray-200 mx-auto" />
            <div className="h-8 w-16 bg-gray-200 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
