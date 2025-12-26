"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslations } from "next-intl";
import { TaskBoard } from "@/components/taskboard";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TasksPage() {
  const t = useTranslations("tasks");
  const corridor = useQuery(api.corridors.getActiveCorridor);

  // Loading state
  if (corridor === undefined) {
    return (
      <>
        <DashboardNav />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="animate-spin text-gray-400" size={32} />
        </div>
      </>
    );
  }

  // No corridor
  if (!corridor) {
    return (
      <>
        <DashboardNav />
        <div className="border-4 border-black bg-yellow-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
          <h2 className="text-xl font-bold mb-2">{t("noCorridor")}</h2>
          <p className="text-gray-600 mb-4">{t("noCorridorDescription")}</p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 font-bold border-2 border-black shadow-[2px_2px_0_0_#666] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {t("startOnboarding")}
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardNav />

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title={t("backToDashboard")}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="font-head text-2xl md:text-3xl font-bold">
              {t("title")}
            </h1>
            <p className="text-gray-600">
              {corridor.origin} → {corridor.destination}
            </p>
          </div>
        </div>
      </div>

      {/* Full Task Board */}
      <TaskBoard corridorId={corridor._id} />

      {/* Tips Section */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="border-4 border-black bg-cyan-50 p-4 shadow-[3px_3px_0_0_#000]">
          <h3 className="font-bold mb-2">{t("tips.dragDrop.title")}</h3>
          <p className="text-sm text-gray-700">{t("tips.dragDrop.description")}</p>
        </div>
        <div className="border-4 border-black bg-amber-50 p-4 shadow-[3px_3px_0_0_#000]">
          <h3 className="font-bold mb-2">{t("tips.protocols.title")}</h3>
          <p className="text-sm text-gray-700">{t("tips.protocols.description")}</p>
        </div>
        <div className="border-4 border-black bg-green-50 p-4 shadow-[3px_3px_0_0_#000]">
          <h3 className="font-bold mb-2">{t("tips.sync.title")}</h3>
          <p className="text-sm text-gray-700">{t("tips.sync.description")}</p>
        </div>
      </div>
    </>
  );
}
