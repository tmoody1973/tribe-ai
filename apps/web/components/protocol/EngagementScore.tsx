"use client";

import { ThumbsUp } from "lucide-react";

interface EngagementScoreProps {
  score: number;
}

function formatScore(score: number): string {
  if (score >= 1000) return `${(score / 1000).toFixed(1)}k`;
  return score.toString();
}

export function EngagementScore({ score }: EngagementScoreProps) {
  const level = score >= 100 ? "high" : score >= 30 ? "medium" : "low";

  const colors = {
    high: "text-green-600",
    medium: "text-yellow-600",
    low: "text-gray-500",
  };

  return (
    <span className={`flex items-center gap-1 ${colors[level]}`}>
      <ThumbsUp size={14} />
      <span>{formatScore(score)}</span>
    </span>
  );
}
