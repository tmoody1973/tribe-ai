"use client";

import { useTranslations } from "next-intl";
import { Id } from "@/convex/_generated/dataModel";

interface Protocol {
  _id: Id<"protocols">;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  order: number;
}

interface ProtocolListProps {
  protocols: Protocol[];
  corridorId: Id<"corridors">;
}

const categoryColors: Record<string, string> = {
  visa: "bg-red-100 text-red-800 border-red-800",
  finance: "bg-green-100 text-green-800 border-green-800",
  housing: "bg-blue-100 text-blue-800 border-blue-800",
  employment: "bg-purple-100 text-purple-800 border-purple-800",
  legal: "bg-orange-100 text-orange-800 border-orange-800",
  health: "bg-pink-100 text-pink-800 border-pink-800",
  social: "bg-teal-100 text-teal-800 border-teal-800",
};

const priorityIcons: Record<string, string> = {
  critical: "🔴",
  high: "🟠",
  medium: "🟡",
  low: "🟢",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ProtocolList({ protocols, corridorId }: ProtocolListProps) {
  const t = useTranslations("dashboard.protocols");

  if (protocols.length === 0) {
    return (
      <div className="border-4 border-black bg-gray-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
        <p className="text-gray-600">{t("noProtocols")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{t("title")}</h2>
      {protocols.map((protocol) => (
        <div
          key={protocol._id}
          className="border-4 border-black bg-white p-4 shadow-[4px_4px_0_0_#000] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`px-2 py-1 text-xs font-bold border ${categoryColors[protocol.category] ?? "bg-gray-100"}`}
                >
                  {protocol.category}
                </span>
                <span title={protocol.priority}>
                  {priorityIcons[protocol.priority] ?? "⚪"}
                </span>
              </div>
              <h3 className="font-bold text-lg">{protocol.title}</h3>
              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                {protocol.description}
              </p>
            </div>
            <div className="text-2xl">
              {protocol.status === "completed" ? "✅" : "⬜"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
