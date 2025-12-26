"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { LayoutGrid, Plus, ArrowRight, Loader2 } from "lucide-react";

interface TaskBoardSummaryProps {
  corridorId: Id<"corridors">;
}

export function TaskBoardSummary({ corridorId }: TaskBoardSummaryProps) {
  const t = useTranslations("tasks");
  const taskCounts = useQuery(api.tasks.getTaskCounts, { corridorId });

  if (taskCounts === undefined) {
    return (
      <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] p-4">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      </div>
    );
  }

  const activeTasks = taskCounts.todo + taskCounts.in_progress + taskCounts.blocked;
  const completionRate = taskCounts.total > 0
    ? Math.round((taskCounts.done / taskCounts.total) * 100)
    : 0;

  return (
    <div className="border-4 border-black bg-gradient-to-br from-cyan-50 to-white shadow-[4px_4px_0_0_#000]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <LayoutGrid size={20} className="text-cyan-600" />
          <h3 className="font-bold">{t("summary.title")}</h3>
        </div>
        <Link
          href="/dashboard/tasks"
          className="text-sm font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1"
        >
          {t("summary.viewAll")}
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stats */}
      <div className="p-4">
        {taskCounts.total === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">{t("summary.empty")}</p>
            <Link
              href="/dashboard/tasks"
              className="inline-flex items-center gap-2 bg-cyan-500 text-white px-3 py-1.5 text-sm font-bold border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Plus size={14} />
              {t("summary.addFirst")}
            </Link>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">{t("summary.progress")}</span>
                <span className="font-bold">{completionRate}%</span>
              </div>
              <div className="h-3 bg-gray-200 border-2 border-black overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            {/* Column Counts */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-white border-2 border-black p-2">
                <div className="text-lg font-bold text-gray-700">{taskCounts.todo}</div>
                <div className="text-xs text-gray-500">{t("columns.todo")}</div>
              </div>
              <div className="bg-blue-50 border-2 border-black p-2">
                <div className="text-lg font-bold text-blue-600">{taskCounts.in_progress}</div>
                <div className="text-xs text-gray-500">{t("columns.inProgress")}</div>
              </div>
              <div className="bg-red-50 border-2 border-black p-2">
                <div className="text-lg font-bold text-red-600">{taskCounts.blocked}</div>
                <div className="text-xs text-gray-500">{t("columns.blocked")}</div>
              </div>
              <div className="bg-green-50 border-2 border-black p-2">
                <div className="text-lg font-bold text-green-600">{taskCounts.done}</div>
                <div className="text-xs text-gray-500">{t("columns.done")}</div>
              </div>
            </div>

            {/* Active Tasks Alert */}
            {activeTasks > 0 && (
              <div className="mt-4 bg-amber-100 border-2 border-amber-500 p-2 text-sm">
                <span className="font-bold">{activeTasks}</span> {t("summary.activeTasks")}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
