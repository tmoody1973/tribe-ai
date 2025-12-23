"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslations } from "next-intl";
import {
  MessageCircle,
  Users,
  Clock,
  Heart,
  Utensils,
  PartyPopper,
  Edit3,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface DimensionDisplayProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}

function DimensionDisplay({ icon, label, value, colorClass }: DimensionDisplayProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border-2 border-black">
      <div className={`p-2 ${colorClass} border-2 border-black`}>{icon}</div>
      <div>
        <div className="text-xs text-gray-500 uppercase font-medium">{label}</div>
        <div className="font-bold">{value}</div>
      </div>
    </div>
  );
}

interface TagListProps {
  title: string;
  items: string[];
  colorClass: string;
}

function TagList({ title, items, colorClass }: TagListProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="p-3">
      <div className="text-xs text-gray-500 uppercase font-medium mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className={`${colorClass} border-2 border-black px-2 py-1 text-sm font-medium`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function CulturalProfileSummary() {
  const t = useTranslations("cultural");
  const profile = useQuery(api.cultural.profile.getProfile);

  // Loading state
  if (profile === undefined) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin" size={24} />
        </div>
      </div>
    );
  }

  // No profile - show CTA
  if (!profile) {
    return (
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-black p-6 shadow-[6px_6px_0_0_#000]">
        <div className="text-center">
          <div className="text-5xl mb-4">🌍</div>
          <h3 className="font-head text-xl mb-2">{t("noCulturalProfile")}</h3>
          <p className="text-gray-600 mb-4 max-w-sm mx-auto">
            {t("completeProfileCta")}
          </p>
          <Link
            href="/cultural/profile"
            className="inline-block bg-amber-400 border-4 border-black px-5 py-2 font-bold shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {t("buildProfile")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black shadow-[6px_6px_0_0_#000] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 border-b-4 border-black p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-head text-xl text-black">{t("yourCulturalProfile")}</h3>
            <p className="text-sm text-black/70">{profile.originCulture}</p>
          </div>
          <Link
            href="/cultural/profile"
            className="p-2 bg-white/50 hover:bg-white/70 border-2 border-black transition-colors"
            title={t("editProfile")}
          >
            <Edit3 size={18} />
          </Link>
        </div>
      </div>

      {/* Cultural Dimensions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-b-2 border-gray-200">
        <DimensionDisplay
          icon={<MessageCircle size={20} className="text-blue-600" />}
          label={t("communication")}
          value={t(`styles.${profile.communicationStyle}`)}
          colorClass="bg-blue-100"
        />
        <DimensionDisplay
          icon={<Users size={20} className="text-green-600" />}
          label={t("family")}
          value={t(`familyTypes.${profile.familyStructure}`)}
          colorClass="bg-green-100"
        />
        <DimensionDisplay
          icon={<Clock size={20} className="text-purple-600" />}
          label={t("timeOrientation")}
          value={t(`timeTypes.${profile.timeOrientation}`)}
          colorClass="bg-purple-100"
        />
      </div>

      {/* Values */}
      <div className="border-b-2 border-gray-200">
        <TagList
          title={t("coreValues")}
          items={profile.values}
          colorClass="bg-red-100"
        />
      </div>

      {/* Food & Dietary */}
      <div className="border-b-2 border-gray-200">
        <TagList
          title={t("foodDietary")}
          items={profile.foodDietary}
          colorClass="bg-orange-100"
        />
      </div>

      {/* Celebrations */}
      <TagList
        title={t("celebrations")}
        items={profile.celebrations}
        colorClass="bg-yellow-100"
      />

      {/* Footer with last updated */}
      <div className="bg-gray-50 border-t-2 border-gray-200 p-3 text-center">
        <p className="text-xs text-gray-500">
          {t("lastUpdated")}: {new Date(profile.updatedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
