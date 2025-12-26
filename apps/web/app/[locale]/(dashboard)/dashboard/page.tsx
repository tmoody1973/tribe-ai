"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CorridorHeader } from "@/components/corridor/CorridorHeader";
import { QuickStats } from "@/components/corridor/QuickStats";
import { ProtocolTabs } from "@/components/protocol/ProtocolTabs";
import { DashboardSkeleton } from "@/components/corridor/DashboardSkeleton";
import { EmptyState } from "@/components/corridor/EmptyState";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { JourneyMap } from "@/components/dashboard/JourneyMap";
import { CulturalBridge } from "@/components/dashboard/CulturalBridge";
import { CountryInfoCard } from "@/components/dashboard/CountryInfoCard";
import { VisaEligibilityQuiz } from "@/components/dashboard/VisaEligibilityQuiz";
import { TrueCostCalculator } from "@/components/dashboard/TrueCostCalculator";
import { First48HoursGuide } from "@/components/dashboard/First48HoursGuide";
import { EmergencyInfoCard } from "@/components/dashboard/EmergencyInfoCard";
import { SalaryRealityCheck } from "@/components/dashboard/SalaryRealityCheck";
import { CulturalProfileSummary } from "@/components/cultural/CulturalProfileSummary";
import { DocumentVaultSummary } from "@/components/documents/DocumentVaultSummary";
import { TaskBoardSummary } from "@/components/taskboard/TaskBoardSummary";
import { LiveCorridorFeed } from "@/components/dashboard/LiveCorridorFeed";

export default function DashboardPage() {
  // Get active corridor
  const corridor = useQuery(api.corridors.getActiveCorridor);

  // Get user profile for userId
  const profile = useQuery(api.users.getProfile);

  // Get protocols with freshness
  const protocolData = useQuery(
    api.protocols.getProtocolsWithFreshness,
    corridor ? { corridorId: corridor._id } : "skip"
  );

  // Loading state
  if (corridor === undefined) {
    return (
      <>
        <DashboardNav />
        <DashboardSkeleton />
      </>
    );
  }

  // No corridor - this shouldn't happen due to DashboardGuard,
  // but handle gracefully
  if (!corridor) {
    return (
      <div className="border-4 border-black bg-yellow-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
        <h2 className="text-xl font-bold mb-2">No corridor found</h2>
        <p className="text-gray-600">Please complete onboarding to set up your migration corridor.</p>
      </div>
    );
  }

  const protocols = protocolData?.protocols ?? [];
  const isResearching = protocolData?.freshness?.status === "refreshing";
  const hasNoProtocols = protocols.length === 0;

  return (
    <>
      <DashboardNav />

      <div className="space-y-6">
        <CorridorHeader corridor={corridor} />

        {/* Journey Map */}
        <JourneyMap
          origin={corridor.origin}
          destination={corridor.destination}
        />

        {/* Live Corridor Feed - Real-time community updates */}
        <LiveCorridorFeed
          origin={corridor.origin}
          destination={corridor.destination}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            {hasNoProtocols ? (
              <EmptyState corridorId={corridor._id} />
            ) : (
              <ProtocolTabs
                protocols={protocols}
                corridorId={corridor._id}
                corridorOrigin={corridor.origin}
                corridorDestination={corridor.destination}
                userId={profile?._id}
              />
            )}

            {/* Show refreshing indicator if updating */}
            {isResearching && protocols.length > 0 && (
              <div className="mt-4 border-4 border-black bg-blue-50 p-4 text-center">
                <span className="animate-pulse">🔄</span> Updating protocols with latest research...
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Task Board Summary - Links to full board */}
            <TaskBoardSummary corridorId={corridor._id} />

            {/* Document Vault Summary - Links to full vault */}
            <DocumentVaultSummary />

            <QuickStats corridorId={corridor._id} />

            {/* Cultural Profile - Interview summary or CTA */}
            <CulturalProfileSummary />

            {/* Cultural Bridge - AI-powered cultural comparison */}
            <CulturalBridge
              origin={corridor.origin}
              destination={corridor.destination}
            />

            {/* Country Guide Card */}
            <CountryInfoCard
              destination={corridor.destination}
              origin={corridor.origin}
            />

            {/* Migrant Tools */}
            <VisaEligibilityQuiz
              destination={corridor.destination}
              origin={corridor.origin}
            />
            <TrueCostCalculator
              destination={corridor.destination}
              origin={corridor.origin}
            />
            <SalaryRealityCheck destination={corridor.destination} />
            <First48HoursGuide destination={corridor.destination} />
            <EmergencyInfoCard
              destination={corridor.destination}
              origin={corridor.origin}
            />
          </div>
        </div>
      </div>
    </>
  );
}
