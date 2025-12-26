"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Radio,
  Users,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Clock,
  MessageSquare,
  ArrowUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface LiveCorridorFeedProps {
  origin: string;
  destination: string;
}

interface FeedItem {
  _id?: string;
  source: "reddit" | "forum" | "news" | "official";
  title: string;
  snippet: string;
  url: string;
  author?: string;
  subreddit?: string;
  upvotes?: number;
  comments?: number;
  timestamp?: number;
  isAlert?: boolean;
  alertType?: "opportunity" | "warning" | "update";
}

interface CorridorStats {
  activeUsers: number;
  successfulMoves: number;
  avgTimeToMove?: string;
  lastUpdated: number;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

function SourceBadge({ source }: { source: FeedItem["source"] }) {
  const styles = {
    reddit: "bg-orange-100 text-orange-700 border-orange-300",
    forum: "bg-blue-100 text-blue-700 border-blue-300",
    news: "bg-purple-100 text-purple-700 border-purple-300",
    official: "bg-green-100 text-green-700 border-green-300",
  };

  const labels = {
    reddit: "Reddit",
    forum: "Forum",
    news: "News",
    official: "Official",
  };

  return (
    <span className={`text-xs px-1.5 py-0.5 border rounded ${styles[source]}`}>
      {labels[source]}
    </span>
  );
}

function AlertBadge({ type }: { type: "opportunity" | "warning" | "update" }) {
  const styles = {
    opportunity: "bg-green-500 text-white",
    warning: "bg-red-500 text-white",
    update: "bg-blue-500 text-white",
  };

  const labels = {
    opportunity: "Opportunity",
    warning: "Warning",
    update: "Update",
  };

  return (
    <span className={`text-xs px-2 py-0.5 font-bold rounded-full animate-pulse ${styles[type]}`}>
      {labels[type]}
    </span>
  );
}

export function LiveCorridorFeed({ origin, destination }: LiveCorridorFeedProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [stats, setStats] = useState<CorridorStats | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get cached feed from Convex
  const cachedFeed = useQuery(api.corridorFeed.getCorridorFeed, {
    origin,
    destination,
    limit: 10,
  });

  const cachedStats = useQuery(api.corridorFeed.getCorridorStats, {
    origin,
    destination,
  });

  // Use cached data if available
  useEffect(() => {
    if (cachedFeed && cachedFeed.length > 0) {
      setItems(cachedFeed as FeedItem[]);
    }
    if (cachedStats) {
      setStats(cachedStats);
    }
  }, [cachedFeed, cachedStats]);

  // Fetch fresh data on mount and periodically
  const fetchFeed = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/corridor-feed?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${forceRefresh ? "&refresh=true" : ""}`
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setItems(data.items || []);
      setStats(data.stats);
      setLastRefresh(Date.now());
    } catch (err) {
      console.error("Feed fetch error:", err);
      setError("Couldn't refresh feed");
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!cachedFeed || cachedFeed.length === 0) {
      fetchFeed();
    }
  }, [origin, destination]);

  // Get alert items
  const alertItems = items.filter((item) => item.isAlert);
  const regularItems = items.filter((item) => !item.isAlert);

  return (
    <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 border-b-4 border-black p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Radio size={16} className="text-white animate-pulse" />
              <span className="text-white font-bold text-sm">LIVE</span>
            </div>
            <h3 className="font-bold text-white">Corridor Feed</h3>
          </div>
          <button
            onClick={() => fetchFeed(true)}
            disabled={isLoading}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors"
            title="Refresh feed"
          >
            <RefreshCw
              size={16}
              className={`text-white ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Corridor Stats */}
        {stats && (
          <div className="flex items-center gap-4 mt-3 text-white/90 text-sm">
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span className="font-bold">{stats.activeUsers.toLocaleString()}</span>
              <span className="text-white/70">tracking</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 size={14} />
              <span className="font-bold">{stats.successfulMoves}</span>
              <span className="text-white/70">moved this month</span>
            </div>
          </div>
        )}
      </div>

      {/* Alerts Section */}
      {alertItems.length > 0 && (
        <div className="border-b-4 border-black">
          {alertItems.slice(0, 2).map((item, i) => (
            <a
              key={item._id || i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-3 border-b-2 border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors ${
                item.alertType === "opportunity"
                  ? "bg-green-50"
                  : item.alertType === "warning"
                  ? "bg-red-50"
                  : "bg-blue-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.alertType && <AlertBadge type={item.alertType} />}
                    <SourceBadge source={item.source} />
                  </div>
                  <p className="font-bold text-sm line-clamp-2">{item.title}</p>
                </div>
                <ExternalLink size={14} className="text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Feed Items */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading && items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-gray-400 mr-2" size={20} />
            <span className="text-gray-500">Loading corridor updates...</span>
          </div>
        ) : regularItems.length > 0 ? (
          regularItems.slice(0, 8).map((item, i) => (
            <a
              key={item._id || i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 border-b-2 border-gray-100 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SourceBadge source={item.source} />
                    {item.subreddit && (
                      <span className="text-xs text-gray-500">r/{item.subreddit}</span>
                    )}
                    {item.timestamp && (
                      <span className="text-xs text-gray-400">
                        <Clock size={10} className="inline mr-0.5" />
                        {timeAgo(item.timestamp)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </p>
                  {item.snippet && (
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                      {item.snippet}
                    </p>
                  )}
                  {/* Engagement */}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    {item.upvotes !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <ArrowUp size={12} />
                        {item.upvotes}
                      </span>
                    )}
                    {item.comments !== undefined && (
                      <span className="flex items-center gap-0.5">
                        <MessageSquare size={12} />
                        {item.comments}
                      </span>
                    )}
                    {item.author && (
                      <span className="text-gray-400">by u/{item.author}</span>
                    )}
                  </div>
                </div>
                <ExternalLink
                  size={14}
                  className="text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors"
                />
              </div>
            </a>
          ))
        ) : (
          <div className="text-center py-8">
            <Sparkles size={24} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm">No updates yet</p>
            <button
              onClick={() => fetchFeed(true)}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Fetch latest updates
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-50 border-t-2 border-gray-200 flex items-center justify-between text-xs text-gray-500">
        <span>
          {origin} → {destination}
        </span>
        {lastRefresh && (
          <span>Updated {timeAgo(lastRefresh)}</span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 bg-yellow-50 border-t-2 border-yellow-300 text-xs text-yellow-700 flex items-center gap-1">
          <AlertTriangle size={12} />
          {error}
        </div>
      )}
    </div>
  );
}
