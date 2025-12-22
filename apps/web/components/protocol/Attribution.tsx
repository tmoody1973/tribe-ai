"use client";

import { formatDistanceToNow } from "date-fns";
import { ExternalLink, MessageCircle, Globe, FileText, Building } from "lucide-react";
import { useTranslations } from "next-intl";
import { EngagementScore } from "./EngagementScore";

type SourceType = "reddit" | "forum" | "blog" | "government" | "news";

interface AttributionData {
  authorName?: string;
  sourceUrl: string;
  sourceDate?: number;
  engagement?: number;
}

interface AttributionProps {
  attribution: AttributionData;
  source: SourceType;
}

const sourceIcons = {
  reddit: MessageCircle,
  forum: MessageCircle,
  blog: FileText,
  government: Building,
  news: Globe,
};

const sourceColors: Record<SourceType, string> = {
  reddit: "text-orange-500",
  forum: "text-blue-500",
  blog: "text-purple-500",
  government: "text-green-600",
  news: "text-gray-600",
};

export function Attribution({ attribution, source }: AttributionProps) {
  const t = useTranslations("attribution");
  const Icon = sourceIcons[source] ?? Globe;

  const formattedDate = attribution.sourceDate
    ? formatDistanceToNow(new Date(attribution.sourceDate), { addSuffix: true })
    : null;

  return (
    <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
      {/* Source Icon */}
      <Icon size={16} className={sourceColors[source]} />

      {/* Author */}
      <span className="font-medium">
        {attribution.authorName ?? t("anonymous")}
      </span>

      {/* Date */}
      {formattedDate && (
        <>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">{formattedDate}</span>
        </>
      )}

      {/* Engagement */}
      {attribution.engagement && attribution.engagement > 0 && (
        <>
          <span>•</span>
          <EngagementScore score={attribution.engagement} />
        </>
      )}

      {/* Link */}
      <a
        href={attribution.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto flex items-center gap-1 text-blue-600 hover:underline"
      >
        {t("viewSource")}
        <ExternalLink size={14} />
      </a>
    </div>
  );
}

// Helper function to detect source type from URL
export function detectSourceType(url: string): SourceType {
  if (url.includes("reddit.com")) return "reddit";
  if (url.includes("nairaland") || url.includes("internations") || url.includes("forum")) return "forum";
  if (url.includes(".gov") || url.includes("embassy") || url.includes("government")) return "government";
  if (url.includes("news") || url.includes("bbc") || url.includes("cnn")) return "news";
  return "blog";
}
