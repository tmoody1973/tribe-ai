"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { LiveCorridorFeed } from "@/components/dashboard/LiveCorridorFeed";

export default function FeedPage() {
  // Get active corridor for origin/destination
  const corridor = useQuery(api.corridors.getActiveCorridor) as Doc<"corridors"> | undefined | null;

  // Loading state
  if (corridor === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // No corridor found
  if (!corridor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="border-4 border-black bg-yellow-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
            <h2 className="text-xl font-bold mb-2">No corridor found</h2>
            <p className="text-gray-600">Please complete onboarding to set up your migration corridor.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2">
            📡 Migration Feed
          </h1>
          <p className="text-lg text-gray-600">
            Real-time updates, videos, and community discussions about your migration corridor
          </p>
        </div>

        {/* Feed */}
        <LiveCorridorFeed origin={corridor.origin} destination={corridor.destination} />
      </div>
    </div>
  );
}
