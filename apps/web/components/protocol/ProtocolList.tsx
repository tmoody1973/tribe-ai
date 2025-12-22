"use client";

import { useTranslations } from "next-intl";
import { Id } from "@/convex/_generated/dataModel";
import { ProtocolCard } from "./ProtocolCard";

type Category = "visa" | "finance" | "housing" | "employment" | "legal" | "health" | "social";
type Priority = "critical" | "high" | "medium" | "low";
type Status = "not_started" | "in_progress" | "completed" | "blocked";

interface Protocol {
  _id: Id<"protocols">;
  category: Category;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  warnings?: string[];
  hacks?: string[];
  order: number;
}

interface ProtocolListProps {
  protocols: Protocol[];
  corridorId: Id<"corridors">;
}

export function ProtocolList({ protocols }: ProtocolListProps) {
  const t = useTranslations("protocols");

  // Sort by order
  const sorted = [...protocols].sort((a, b) => a.order - b.order);

  // Find current step (first non-completed)
  const currentIndex = sorted.findIndex((p) => p.status !== "completed");

  // Count completed
  const completedCount = sorted.filter((p) => p.status === "completed").length;

  if (sorted.length === 0) {
    return (
      <div className="border-4 border-black bg-gray-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
        <p className="text-gray-600">{t("noProtocols")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">{t("yourProtocol")}</h2>
        <span className="text-sm text-gray-600 border-2 border-black px-3 py-1 bg-white">
          {completedCount} / {sorted.length} {t("completed")}
        </span>
      </div>

      {/* Protocol Cards with Timeline */}
      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-7 top-5 bottom-5 w-1 bg-black -z-10" />

        {/* Cards */}
        <div className="space-y-4 relative">
          {sorted.map((protocol, index) => (
            <ProtocolCard
              key={protocol._id}
              protocol={protocol}
              isCurrent={index === currentIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
