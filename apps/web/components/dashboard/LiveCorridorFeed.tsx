"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Radio,
  Users,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Clock,
  MessageSquare,
  ArrowUp,
  Loader2,
  CheckCircle2,
  Play,
  Brain,
  TrendingUp,
} from "lucide-react";

interface LiveCorridorFeedProps {
  origin: string;
  destination: string;
}

interface VideoAnalysis {
  summary: string;
  keyTimestamps: Array<{
    time: string;
    topic: string;
  }>;
  youllLearn: string;
}

interface FeedItem {
  _id?: string;
  source: "reddit" | "forum" | "news" | "official" | "youtube";
  type?: string;
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
  thumbnail?: string;
  relevanceScore?: number;
  stageScore?: number;
  aiReason?: string;
  aiSummary?: VideoAnalysis;
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
    youtube: "bg-red-100 text-red-700 border-red-300",
  };

  const labels = {
    reddit: "Reddit",
    forum: "Forum",
    news: "News",
    official: "Official",
    youtube: "YouTube",
  };

  return (
    <span
      className={`text-xs px-2 py-0.5 border-2 rounded font-bold ${styles[source]}`}
    >
      {labels[source]}
    </span>
  );
}

function AlertBadge({ type }: { type: "opportunity" | "warning" | "update" }) {
  const styles = {
    opportunity: "bg-green-500 text-white border-green-700",
    warning: "bg-red-500 text-white border-red-700",
    update: "bg-blue-500 text-white border-blue-700",
  };

  const labels = {
    opportunity: "🎯 Opportunity",
    warning: "⚠️ Warning",
    update: "📢 Update",
  };

  return (
    <span
      className={`text-xs px-2 py-1 font-bold border-2 rounded-full animate-pulse ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

function RelevanceScore({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-green-500 border-green-700"
      : score >= 60
      ? "bg-yellow-500 border-yellow-700"
      : "bg-gray-400 border-gray-600";

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 border-2 rounded ${color} text-white text-xs font-bold`}
      title="AI Relevance Score"
    >
      <TrendingUp size={12} />
      {score}
    </div>
  );
}

function VideoCard({ item }: { item: FeedItem }) {
  const [showSummary, setShowSummary] = useState(false);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-4 border-black bg-white shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden"
    >
      {/* Video Thumbnail */}
      {item.thumbnail && (
        <div className="relative">
          <img
            src={item.thumbnail}
            alt={item.title}
            className="w-full h-32 sm:h-40 md:h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/30 transition-colors">
            <div className="bg-red-600 rounded-full p-3 border-2 border-white shadow-lg">
              <Play fill="white" className="text-white" size={24} />
            </div>
          </div>
          {/* Relevance Score Badge */}
          {item.relevanceScore !== undefined && (
            <div className="absolute top-2 right-2">
              <RelevanceScore score={item.relevanceScore} />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        <div className="flex items-start gap-2">
          <SourceBadge source={item.source} />
          {item.timestamp && (
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <Clock size={10} />
              {timeAgo(item.timestamp)}
            </span>
          )}
        </div>

        <h4 className="font-bold text-base sm:text-sm leading-snug line-clamp-2">
          {item.title}
        </h4>

        {/* AI Summary */}
        {item.aiSummary && (
          <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded space-y-2">
            <div className="flex items-center gap-1 text-blue-700 font-bold text-xs">
              <Brain size={12} />
              AI Summary
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              {item.aiSummary.summary}
            </p>

            {/* You'll Learn */}
            <div className="bg-white border border-blue-200 p-2 rounded">
              <p className="text-xs font-bold text-blue-900">
                💡 You&apos;ll learn: {item.aiSummary.youllLearn}
              </p>
            </div>

            {/* Key Timestamps (Toggle) - Better touch target */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowSummary(!showSummary);
              }}
              className="text-sm sm:text-xs text-blue-600 hover:text-blue-800 active:text-blue-900 font-bold underline py-2 px-1 -mx-1 min-h-[44px] sm:min-h-0 flex items-center"
            >
              {showSummary ? "Hide" : "Show"} Key Timestamps
            </button>

            {showSummary && (
              <div className="space-y-1 pt-1">
                {item.aiSummary.keyTimestamps.map((ts, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs bg-white border border-blue-100 p-2 rounded"
                  >
                    <span className="font-bold text-blue-700 flex-shrink-0">
                      {ts.time}
                    </span>
                    <span className="text-gray-700">{ts.topic}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Reason (if no summary) */}
        {!item.aiSummary && item.aiReason && (
          <div className="bg-gray-50 border-2 border-gray-200 p-2 rounded">
            <p className="text-xs text-gray-600 italic">
              <Brain size={10} className="inline mr-1" />
              {item.aiReason}
            </p>
          </div>
        )}

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>by {item.author}</span>
        </div>
      </div>
    </a>
  );
}

function RegularFeedCard({ item }: { item: FeedItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 sm:p-5 border-b-4 border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors group min-h-[88px]"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <SourceBadge source={item.source} />
            {item.relevanceScore !== undefined && (
              <RelevanceScore score={item.relevanceScore} />
            )}
            {item.subreddit && (
              <span className="text-xs text-gray-500 font-medium">
                r/{item.subreddit}
              </span>
            )}
            {item.timestamp && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Clock size={10} />
                {timeAgo(item.timestamp)}
              </span>
            )}
          </div>

          <p className="text-base sm:text-sm font-bold leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
            {item.title}
          </p>

          {item.snippet && (
            <p className="text-sm sm:text-xs text-gray-600 leading-relaxed line-clamp-2">
              {item.snippet}
            </p>
          )}

          {/* AI Reason */}
          {item.aiReason && !item.aiSummary && (
            <div className="bg-blue-50 border-2 border-blue-200 p-2 rounded">
              <p className="text-xs text-gray-700 italic">
                <Brain size={10} className="inline mr-1" />
                {item.aiReason}
              </p>
            </div>
          )}

          {/* Engagement */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {item.upvotes !== undefined && (
              <span className="flex items-center gap-1 font-medium">
                <ArrowUp size={12} />
                {item.upvotes}
              </span>
            )}
            {item.comments !== undefined && (
              <span className="flex items-center gap-1 font-medium">
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
  );
}

export function LiveCorridorFeed({
  origin,
  destination,
}: LiveCorridorFeedProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);
  const [stats, setStats] = useState<CorridorStats | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get cached feed from Convex
  const cachedFeed = useQuery(api.corridorFeed.getCorridorFeed, {
    origin,
    destination,
    limit: 50, // Load more for infinite scroll
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

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < items.length) {
          setDisplayCount((prev) => Math.min(prev + 10, items.length));
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [displayCount, items.length]);

  // Get alert items
  const alertItems = items.filter((item) => item.isAlert);
  const regularItems = items.filter((item) => !item.isAlert);
  const displayedItems = regularItems.slice(0, displayCount);

  // Separate videos from other content
  const videoItems = displayedItems.filter((item) => item.source === "youtube");
  const otherItems = displayedItems.filter((item) => item.source !== "youtube");

  return (
    <div className="border-4 border-black bg-white shadow-[8px_8px_0_0_#000] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 border-b-4 border-black p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Radio size={18} className="text-white animate-pulse" />
              <span className="text-white font-black text-lg">LIVE</span>
            </div>
            <h3 className="font-black text-white text-lg">Corridor Feed</h3>
          </div>
          <button
            onClick={() => fetchFeed(true)}
            disabled={isLoading}
            className="p-2 bg-white/20 hover:bg-white/30 border-2 border-white/40 rounded-lg transition-all hover:scale-105 active:scale-95"
            title="Refresh feed"
          >
            <RefreshCw
              size={18}
              className={`text-white ${isLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Corridor Stats */}
        {stats && (
          <div className="flex items-center gap-4 mt-3 text-white text-sm font-bold">
            <div className="flex items-center gap-1.5">
              <Users size={16} />
              <span>{stats.activeUsers.toLocaleString()}</span>
              <span className="text-white/80 font-normal">tracking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>{stats.successfulMoves}</span>
              <span className="text-white/80 font-normal">moved this month</span>
            </div>
          </div>
        )}
      </div>

      {/* Alerts Section */}
      {alertItems.length > 0 && (
        <div className="border-b-4 border-black bg-yellow-50">
          {alertItems.slice(0, 3).map((item, i) => (
            <a
              key={item._id || i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-4 border-b-4 border-yellow-200 last:border-b-0 hover:bg-yellow-100 transition-colors ${
                item.alertType === "opportunity"
                  ? "bg-green-50"
                  : item.alertType === "warning"
                  ? "bg-red-50"
                  : "bg-blue-50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.alertType && <AlertBadge type={item.alertType} />}
                    <SourceBadge source={item.source} />
                  </div>
                  <p className="font-black text-sm line-clamp-2">{item.title}</p>
                  {item.snippet && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {item.snippet}
                    </p>
                  )}
                </div>
                <ExternalLink size={16} className="text-gray-400 flex-shrink-0 mt-1" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Feed Items */}
      <div className="max-h-[600px] overflow-y-auto">
        {isLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-gray-400 mb-3" size={32} />
            <span className="text-gray-600 font-bold">
              Loading corridor updates...
            </span>
          </div>
        ) : displayedItems.length > 0 ? (
          <div className="space-y-6 p-4">
            {/* Video Section */}
            {videoItems.length > 0 && (
              <div>
                <h4 className="font-black text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <Play size={14} className="text-red-500" />
                  Video Guides ({videoItems.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videoItems.map((item, i) => (
                    <VideoCard key={item._id || i} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Other Content */}
            {otherItems.length > 0 && (
              <div>
                <h4 className="font-black text-sm text-gray-700 mb-3 flex items-center gap-2">
                  <MessageSquare size={14} className="text-blue-500" />
                  Community Posts ({otherItems.length})
                </h4>
                <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] overflow-hidden">
                  {otherItems.map((item, i) => (
                    <RegularFeedCard key={item._id || i} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* Load More Trigger */}
            {displayCount < items.length && (
              <div ref={loadMoreRef} className="text-center py-4">
                <Loader2 className="animate-spin text-gray-400 mx-auto" size={24} />
              </div>
            )}

            {/* End of Feed */}
            {displayCount >= items.length && items.length > 10 && (
              <div className="text-center py-4 text-sm text-gray-500 font-medium">
                🎉 You&apos;ve reached the end!
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Sparkles size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-600 font-bold mb-2">No updates yet</p>
            <p className="text-gray-500 text-sm mb-4">
              We&apos;re gathering the latest insights from your corridor
            </p>
            <button
              onClick={() => fetchFeed(true)}
              className="px-4 py-2 bg-blue-500 text-white font-bold border-4 border-black shadow-[4px_4px_0_0_#000] hover:shadow-[6px_6px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              Fetch Latest Updates
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-gray-100 border-t-4 border-gray-300 flex items-center justify-between text-xs font-bold text-gray-600">
        <span>
          {origin} → {destination}
        </span>
        {lastRefresh && <span>Updated {timeAgo(lastRefresh)}</span>}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-yellow-100 border-t-4 border-yellow-400 text-xs text-yellow-800 font-bold flex items-center gap-2">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}
    </div>
  );
}
