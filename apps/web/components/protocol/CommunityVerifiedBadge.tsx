"use client";

import { CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface CommunityVerifiedBadgeProps {
  engagement?: number;
  threshold?: number;
}

export function CommunityVerifiedBadge({
  engagement = 0,
  threshold = 100,
}: CommunityVerifiedBadgeProps) {
  const t = useTranslations("attribution");

  if (engagement < threshold) return null;

  return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-1 border border-green-500">
      <CheckCircle size={12} />
      {t("communityVerified")}
    </span>
  );
}
