"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Archive, Bookmark, ListChecks } from "lucide-react";
import { ProtocolList } from "./ProtocolList";
import { ProtocolArchiveView } from "./ProtocolArchiveView";
import { SavedProtocolsView } from "./SavedProtocolsView";

type Tab = "active" | "archived" | "saved";

interface Protocol {
  _id: Id<"protocols">;
  category: "visa" | "finance" | "housing" | "employment" | "legal" | "health" | "social";
  title: string;
  description: string;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  priority: "critical" | "high" | "medium" | "low";
  warnings?: string[];
  hacks?: string[];
  attribution?: {
    authorName?: string;
    sourceUrl: string;
    sourceDate?: number;
    engagement?: number;
  };
  order: number;
  generatedForStage?: string;
  archived?: boolean;
  archivedAt?: number;
}

interface ProtocolTabsProps {
  protocols: Protocol[];
  corridorId: Id<"corridors">;
  corridorOrigin?: string;
  corridorDestination?: string;
  userId?: Id<"users">;
}

export function ProtocolTabs({
  protocols,
  corridorId,
  corridorOrigin,
  corridorDestination,
  userId,
}: ProtocolTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const t = useTranslations("protocols");

  // Get archived protocols
  const archivedData = useQuery(api.protocolArchive.getArchivedProtocols, {
    corridorId,
  });

  // Get saved protocols (if userId available)
  const savedProtocols = useQuery(
    api.protocolArchive.getSavedProtocolsByCorridor,
    userId ? { userId, corridorId } : "skip"
  );

  // Get journey stats
  const journeyStats = useQuery(api.protocolArchive.getJourneyStats, {
    corridorId,
  });

  const archivedCount = archivedData?.totalArchived ?? 0;
  const savedCount = savedProtocols?.length ?? 0;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: "active",
      label: t("tabs.active"),
      icon: <ListChecks size={18} />,
      count: protocols.length,
    },
    {
      id: "archived",
      label: t("tabs.archived"),
      icon: <Archive size={18} />,
      count: archivedCount,
    },
    {
      id: "saved",
      label: t("tabs.saved"),
      icon: <Bookmark size={18} />,
      count: savedCount,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Journey Progress Summary */}
      {journeyStats && (
        <div className="border-4 border-black bg-gradient-to-r from-yellow-50 to-green-50 p-4 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-400 border-2 border-black flex items-center justify-center">
                <span className="text-2xl">🗺️</span>
              </div>
              <div>
                <h3 className="font-bold">Your Migration Journey</h3>
                <p className="text-sm text-gray-600">
                  {journeyStats.overall.completed} of {journeyStats.overall.total} steps completed
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-black text-green-600">
                  {journeyStats.overall.completionRate}%
                </div>
                <div className="text-xs text-gray-500">Overall</div>
              </div>
              {archivedCount > 0 && (
                <div className="text-center border-l-2 border-gray-300 pl-4">
                  <div className="text-lg font-bold text-blue-600">
                    {journeyStats.archived.stages.length}
                  </div>
                  <div className="text-xs text-gray-500">Past Stages</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
        <div className="flex border-b-4 border-black">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 px-4 py-3 font-bold flex items-center justify-center gap-2 transition-colors
                ${activeTab === tab.id
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                }
              `}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`
                    px-2 py-0.5 text-xs rounded-full
                    ${activeTab === tab.id ? "bg-black text-yellow-400" : "bg-gray-300 text-gray-700"}
                  `}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === "active" && (
            <ProtocolList
              protocols={protocols}
              corridorId={corridorId}
              corridorOrigin={corridorOrigin}
              corridorDestination={corridorDestination}
            />
          )}

          {activeTab === "archived" && (
            <ProtocolArchiveView
              archivedData={archivedData}
              corridorId={corridorId}
            />
          )}

          {activeTab === "saved" && userId && (
            <SavedProtocolsView
              savedProtocols={(savedProtocols ?? []) as any}
              corridorId={corridorId}
              userId={userId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
