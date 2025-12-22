export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="border-4 border-gray-200 bg-gray-100 p-6 h-24 rounded-none" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Protocol List Skeleton */}
        <div className="md:col-span-2 space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-4 border-gray-200 bg-gray-100 p-4 h-32 rounded-none"
            />
          ))}
        </div>

        {/* Stats Skeleton */}
        <div className="border-4 border-gray-200 bg-gray-100 p-4 h-64 rounded-none" />
      </div>
    </div>
  );
}
