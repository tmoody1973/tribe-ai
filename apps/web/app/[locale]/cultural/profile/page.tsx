"use client";

import Link from "next/link";
import { CulturalProfileBuilder } from "@/components/cultural/CulturalProfileBuilder";
import { useTranslations } from "next-intl";
import { ArrowLeft, Home } from "lucide-react";

export default function CulturalProfilePage() {
  const t = useTranslations("cultural");

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b-4 border-black shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-700 hover:text-black font-medium transition-colors"
          >
            <ArrowLeft size={20} />
            <span>{t("backToDashboard")}</span>
          </Link>
          <Link
            href="/dashboard"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Dashboard"
          >
            <Home size={20} />
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <CulturalProfileBuilder />
        </div>
      </div>
    </div>
  );
}
