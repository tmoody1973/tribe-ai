"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslations } from "next-intl";
import { FolderOpen, Plus, ArrowRight, Loader2, AlertTriangle, FileText } from "lucide-react";

export function DocumentVaultSummary() {
  const t = useTranslations("documents");
  const stats = useQuery(api.userDocuments.getDocumentStats);
  const expiringDocs = useQuery(api.userDocuments.getExpiringDocuments);

  if (stats === undefined || stats === null) {
    return (
      <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] p-4">
        <div className="flex items-center justify-center py-6">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      </div>
    );
  }

  const hasExpiringDocs = expiringDocs && expiringDocs.length > 0;

  return (
    <div className="border-4 border-black bg-gradient-to-br from-amber-50 to-white shadow-[4px_4px_0_0_#000]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-black">
        <div className="flex items-center gap-2">
          <FolderOpen size={20} className="text-amber-600" />
          <h3 className="font-bold">{t("summary.title")}</h3>
        </div>
        <Link
          href="/dashboard/documents"
          className="text-sm font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1"
        >
          {t("summary.viewAll")}
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* Stats */}
      <div className="p-4">
        {stats.totalCount === 0 ? (
          <div className="text-center py-4">
            <FileText size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 mb-3">{t("summary.empty")}</p>
            <Link
              href="/dashboard/documents"
              className="inline-flex items-center gap-2 bg-amber-500 text-white px-3 py-1.5 text-sm font-bold border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Plus size={14} />
              {t("summary.uploadFirst")}
            </Link>
          </div>
        ) : (
          <>
            {/* Document Count */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold">{stats.totalCount}</div>
                <div className="text-sm text-gray-500">{t("summary.documents")}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-600">
                  {(stats.totalSize / 1024 / 1024).toFixed(1)} MB
                </div>
                <div className="text-sm text-gray-500">{t("summary.totalSize")}</div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="flex flex-wrap gap-1 mb-3">
              {Object.entries(stats.byCategory || {}).slice(0, 4).map(([category, count]) => (
                <span
                  key={category}
                  className="text-xs bg-white border border-gray-300 px-2 py-0.5 rounded"
                >
                  {category}: {count as number}
                </span>
              ))}
            </div>

            {/* Expiring Documents Alert */}
            {hasExpiringDocs && (
              <div className="bg-red-100 border-2 border-red-500 p-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
                <span className="text-sm text-red-700">
                  <span className="font-bold">{expiringDocs.length}</span>{" "}
                  {t("summary.expiringSoon")}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
