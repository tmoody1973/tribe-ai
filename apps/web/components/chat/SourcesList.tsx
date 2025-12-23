"use client";

import { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Users,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { useIsDesktop } from "@/hooks/useMediaQuery";

export interface Source {
  index: number;
  url: string;
  title?: string;
  author?: string;
  date?: string | number;
  type: "community" | "perplexity";
}

interface SourcesListProps {
  sources: Source[];
}

export function SourcesList({ sources }: SourcesListProps) {
  const isDesktop = useIsDesktop();
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("chat.sources");

  // Update expanded state when screen size changes
  useEffect(() => {
    setExpanded(isDesktop);
  }, [isDesktop]);

  if (sources.length === 0) return null;

  const communityCount = sources.filter((s) => s.type === "community").length;
  const realtimeCount = sources.filter((s) => s.type === "perplexity").length;

  // Find freshness info
  const dates = sources
    .filter((s) => s.date)
    .map((s) =>
      typeof s.date === "string" ? new Date(s.date).getTime() : (s.date as number)
    );
  const oldestDate = dates.length > 0 ? Math.min(...dates) : null;
  const newestDate = dates.length > 0 ? Math.max(...dates) : null;

  // Check if any source is older than 6 months
  const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000;
  const hasOldSources = oldestDate && oldestDate < sixMonthsAgo;

  return (
    <div className="mt-4 border-t-2 border-gray-300 pt-3">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold">{t("title")}</span>
          <SourceCountBadge
            communityCount={communityCount}
            realtimeCount={realtimeCount}
          />
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expanded Content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-[500px] opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-3">
          {/* Freshness Warning */}
          {hasOldSources && (
            <div className="bg-yellow-50 border-2 border-yellow-400 p-2 text-xs text-yellow-700 flex items-center gap-2">
              <Clock size={14} />
              {t("oldSourcesWarning")}
            </div>
          )}

          {/* Freshness Info */}
          {newestDate && (
            <p className="text-xs text-gray-500">
              {t("asOf", {
                date: formatDistanceToNow(new Date(newestDate), {
                  addSuffix: true,
                }),
              })}
            </p>
          )}

          {/* Sources List */}
          <ul className="space-y-2">
            {sources.map((source) => (
              <SourceItem key={source.index} source={source} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SourceCountBadge({
  communityCount,
  realtimeCount,
}: {
  communityCount: number;
  realtimeCount: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {communityCount > 0 && (
        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 border border-blue-300 flex items-center gap-1">
          <Users size={10} />
          {communityCount}
        </span>
      )}
      {realtimeCount > 0 && (
        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 border border-green-300 flex items-center gap-1">
          <Zap size={10} />
          {realtimeCount}
        </span>
      )}
    </div>
  );
}

function SourceItem({ source }: { source: Source }) {
  const t = useTranslations("chat.sources");

  // Extract domain for title fallback
  let domain = source.url;
  try {
    domain = new URL(source.url).hostname.replace("www.", "");
  } catch {
    // Keep original URL if parsing fails
  }
  const title = source.title || domain;

  const dateStr = source.date
    ? formatDistanceToNow(
        typeof source.date === "string"
          ? new Date(source.date)
          : new Date(source.date),
        { addSuffix: true }
      )
    : null;

  return (
    <li className="flex items-start gap-2 text-sm">
      {/* Citation Number */}
      <span className="bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 text-xs border border-gray-400 flex-shrink-0">
        {source.index}
      </span>

      <div className="flex-1 min-w-0">
        {/* Title and Link */}
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
        >
          <span className="truncate">{title}</span>
          <ExternalLink size={12} className="flex-shrink-0" />
        </a>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
          {/* Type Badge */}
          {source.type === "perplexity" ? (
            <span className="text-green-600 flex items-center gap-1">
              <Zap size={10} />
              {t("realtime")}
            </span>
          ) : (
            <span className="text-blue-600 flex items-center gap-1">
              <Users size={10} />
              {t("community")}
            </span>
          )}

          {/* Author */}
          {source.author && (
            <>
              <span>•</span>
              <span>{source.author}</span>
            </>
          )}

          {/* Date */}
          {dateStr && (
            <>
              <span>•</span>
              <span>{dateStr}</span>
            </>
          )}
        </div>
      </div>
    </li>
  );
}
