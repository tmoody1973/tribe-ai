"use client";

import { LiveCorridorFeed } from "@/components/dashboard/LiveCorridorFeed";

export default function FeedPage() {
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
        <LiveCorridorFeed />
      </div>
    </div>
  );
}
