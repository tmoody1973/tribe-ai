import { CulturalProfileBuilder } from "@/components/cultural/CulturalProfileBuilder";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "cultural" });
  return {
    title: t("buildProfile"),
    description: t("profileDescription"),
  };
}

export default function CulturalProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <CulturalProfileBuilder />
      </div>
    </div>
  );
}
