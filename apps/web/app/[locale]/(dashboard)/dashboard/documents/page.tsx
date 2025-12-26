"use client";

import { useTranslations } from "next-intl";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { DocumentVault } from "@/components/documents/DocumentVault";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DocumentsPage() {
  const t = useTranslations("documents");

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
            <p className="text-gray-600">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Full Document Vault */}
      <DocumentVault />

      {/* Tips Section */}
      <div className="mt-6 grid md:grid-cols-3 gap-4">
        <div className="border-4 border-black bg-blue-50 p-4 shadow-[3px_3px_0_0_#000]">
          <h3 className="font-bold mb-2">{t("tips.organize.title")}</h3>
          <p className="text-sm text-gray-700">{t("tips.organize.description")}</p>
        </div>
        <div className="border-4 border-black bg-amber-50 p-4 shadow-[3px_3px_0_0_#000]">
          <h3 className="font-bold mb-2">{t("tips.expiry.title")}</h3>
          <p className="text-sm text-gray-700">{t("tips.expiry.description")}</p>
        </div>
        <div className="border-4 border-black bg-green-50 p-4 shadow-[3px_3px_0_0_#000]">
          <h3 className="font-bold mb-2">{t("tips.secure.title")}</h3>
          <p className="text-sm text-gray-700">{t("tips.secure.description")}</p>
        </div>
      </div>
    </>
  );
}
