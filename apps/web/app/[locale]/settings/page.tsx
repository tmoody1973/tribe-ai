"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CountrySelector } from "@/components/onboarding/CountrySelector";
import { StageSelector } from "@/components/onboarding/StageSelector";
import { StageTransitionModal } from "@/components/protocol/StageTransitionModal";
import { getCountryByCode } from "@/lib/constants/countries";
import type { MigrationStage } from "@/lib/constants/stages";

type Stage = "dreaming" | "planning" | "preparing" | "relocating" | "settling";

export default function SettingsPage() {
  const profile = useQuery(api.users.getProfile);
  const corridor = useQuery(api.corridors.getActiveCorridor) as Doc<"corridors"> | undefined | null;
  const updateProfile = useMutation(api.users.updateProfile);
  const t = useTranslations("settings");
  const tOnboarding = useTranslations("onboarding");

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    originCountry: "",
    destinationCountry: "",
    stage: "" as MigrationStage | "",
    visaType: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showStageTransition, setShowStageTransition] = useState(false);
  const [pendingStage, setPendingStage] = useState<Stage | null>(null);

  useEffect(() => {
    if (profile) {
      setEditValues({
        originCountry: profile.originCountry || "",
        destinationCountry: profile.destinationCountry || "",
        stage: (profile.stage as MigrationStage) || "",
        visaType: profile.visaType || "",
      });
    }
  }, [profile]);

  const handleSave = async (field: string) => {
    // Special handling for stage changes - show transition modal
    if (field === "stage" && editValues.stage && editValues.stage !== profile?.stage) {
      setPendingStage(editValues.stage as Stage);
      setShowStageTransition(true);
      return;
    }

    setIsSaving(true);
    try {
      const updates: Record<string, string | undefined> = {};
      if (field === "originCountry") updates.originCountry = editValues.originCountry;
      if (field === "destinationCountry") updates.destinationCountry = editValues.destinationCountry;
      if (field === "stage" && editValues.stage) updates.stage = editValues.stage;
      if (field === "visaType") updates.visaType = editValues.visaType;

      await updateProfile(updates);
      setIsEditing(null);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle stage transition confirmation (after archiving is done)
  const handleStageTransitionConfirm = async () => {
    if (!pendingStage) return;

    setIsSaving(true);
    try {
      await updateProfile({ stage: pendingStage });
      setIsEditing(null);
      setShowStageTransition(false);
      setPendingStage(null);
    } catch (error) {
      console.error("Failed to update stage:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="border-4 border-black bg-white p-8 shadow-brutal">
            <div className="animate-pulse text-center">Loading...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const originCountry = getCountryByCode(profile?.originCountry || "");
  const destinationCountry = getCountryByCode(profile?.destinationCountry || "");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-head text-3xl mb-8">{t("title")}</h1>

          <div className="space-y-6">
            {/* Origin Country */}
            <div className="border-4 border-black bg-white p-6 shadow-brutal">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg">{t("originCountry")}</h2>
                {isEditing !== "originCountry" && (
                  <button
                    onClick={() => setIsEditing("originCountry")}
                    className="text-sm underline"
                  >
                    {t("edit")}
                  </button>
                )}
              </div>
              {isEditing === "originCountry" ? (
                <div className="space-y-4">
                  <CountrySelector
                    value={editValues.originCountry}
                    onChange={(code) => setEditValues({ ...editValues, originCountry: code })}
                    placeholder={tOnboarding("placeholders.selectCountry")}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("originCountry")}
                      disabled={isSaving}
                      className="border-4 border-black bg-black text-white px-4 py-2 font-bold"
                    >
                      {isSaving ? t("saving") : t("save")}
                    </button>
                    <button
                      onClick={() => setIsEditing(null)}
                      className="border-4 border-black px-4 py-2 font-bold"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  {originCountry ? `${originCountry.flag} ${originCountry.name}` : t("notSet")}
                </p>
              )}
            </div>

            {/* Destination Country */}
            <div className="border-4 border-black bg-white p-6 shadow-brutal">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg">{t("destinationCountry")}</h2>
                {isEditing !== "destinationCountry" && (
                  <button
                    onClick={() => setIsEditing("destinationCountry")}
                    className="text-sm underline"
                  >
                    {t("edit")}
                  </button>
                )}
              </div>
              {isEditing === "destinationCountry" ? (
                <div className="space-y-4">
                  <CountrySelector
                    value={editValues.destinationCountry}
                    onChange={(code) => setEditValues({ ...editValues, destinationCountry: code })}
                    placeholder={tOnboarding("placeholders.selectCountry")}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("destinationCountry")}
                      disabled={isSaving}
                      className="border-4 border-black bg-black text-white px-4 py-2 font-bold"
                    >
                      {isSaving ? t("saving") : t("save")}
                    </button>
                    <button
                      onClick={() => setIsEditing(null)}
                      className="border-4 border-black px-4 py-2 font-bold"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  {destinationCountry
                    ? `${destinationCountry.flag} ${destinationCountry.name}`
                    : t("notSet")}
                </p>
              )}
            </div>

            {/* Migration Stage */}
            <div className="border-4 border-black bg-white p-6 shadow-brutal">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg">{t("stage")}</h2>
                {isEditing !== "stage" && (
                  <button
                    onClick={() => setIsEditing("stage")}
                    className="text-sm underline"
                  >
                    {t("edit")}
                  </button>
                )}
              </div>
              {isEditing === "stage" ? (
                <div className="space-y-4">
                  <StageSelector
                    value={editValues.stage}
                    onChange={(stage) => setEditValues({ ...editValues, stage })}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("stage")}
                      disabled={isSaving}
                      className="border-4 border-black bg-black text-white px-4 py-2 font-bold"
                    >
                      {isSaving ? t("saving") : t("save")}
                    </button>
                    <button
                      onClick={() => setIsEditing(null)}
                      className="border-4 border-black px-4 py-2 font-bold"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">
                  {profile?.stage
                    ? tOnboarding(`stages.${profile.stage}.title`)
                    : t("notSet")}
                </p>
              )}
            </div>

            {/* Visa Type */}
            <div className="border-4 border-black bg-white p-6 shadow-brutal">
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-lg">{t("visaType")}</h2>
                {isEditing !== "visaType" && (
                  <button
                    onClick={() => setIsEditing("visaType")}
                    className="text-sm underline"
                  >
                    {t("edit")}
                  </button>
                )}
              </div>
              {isEditing === "visaType" ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={editValues.visaType}
                    onChange={(e) => setEditValues({ ...editValues, visaType: e.target.value })}
                    placeholder={tOnboarding("placeholders.visaType")}
                    className="w-full border-4 border-black px-4 py-3 font-bold outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("visaType")}
                      disabled={isSaving}
                      className="border-4 border-black bg-black text-white px-4 py-2 font-bold"
                    >
                      {isSaving ? t("saving") : t("save")}
                    </button>
                    <button
                      onClick={() => setIsEditing(null)}
                      className="border-4 border-black px-4 py-2 font-bold"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">{profile?.visaType || t("notSet")}</p>
              )}
            </div>

            {/* Language Note */}
            <div className="border-4 border-black bg-white p-6 shadow-brutal">
              <h2 className="font-bold text-lg mb-2">{t("language")}</h2>
              <p className="text-gray-600">{t("languageHint")}</p>
            </div>

            {/* Voice Settings */}
            <div className="border-4 border-black bg-white p-6 shadow-brutal">
              <h2 className="font-bold text-lg mb-4">{t("voice.title")}</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{t("voice.autoSpeak")}</p>
                  <p className="text-sm text-gray-600">{t("voice.autoSpeakDescription")}</p>
                </div>
                <button
                  onClick={async () => {
                    await updateProfile({ autoSpeak: !profile?.autoSpeak });
                  }}
                  className={`
                    w-14 h-8 border-4 border-black relative transition-colors
                    ${profile?.autoSpeak ? "bg-green-500" : "bg-gray-200"}
                  `}
                  aria-label={t("voice.autoSpeak")}
                >
                  <div
                    className={`
                      absolute top-0.5 w-6 h-6 bg-white border-2 border-black
                      transition-all
                      ${profile?.autoSpeak ? "right-0.5" : "left-0.5"}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Stage Transition Modal */}
      {corridor && pendingStage && profile?.stage && (
        <StageTransitionModal
          isOpen={showStageTransition}
          onClose={() => {
            setShowStageTransition(false);
            setPendingStage(null);
          }}
          currentStage={profile.stage as Stage}
          newStage={pendingStage}
          corridorId={corridor._id}
          onConfirm={handleStageTransitionConfirm}
        />
      )}
    </div>
  );
}
