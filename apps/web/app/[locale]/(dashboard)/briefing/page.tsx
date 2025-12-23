"use client";

import { useQuery, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { Transcript } from "@/components/audio/Transcript";
import { BriefingTypeSelector } from "@/components/audio/BriefingTypeSelector";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Volume2 } from "lucide-react";

export default function BriefingPage() {
  const t = useTranslations("briefing");
  const [briefingType, setBriefingType] = useState<"daily" | "weekly">("daily");
  const [showTranscript, setShowTranscript] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const corridor = useQuery(api.corridors.getActiveCorridor);
  const briefing = useQuery(
    api.ttsQueries.getBriefingWithAudio,
    corridor ? { corridorId: corridor._id, type: briefingType } : "skip"
  );

  const generateBriefing = useAction(api.ai.briefings.generateBriefingScript);

  const handleGenerate = async () => {
    if (!corridor) return;
    setIsGenerating(true);
    try {
      await generateBriefing({
        corridorId: corridor._id,
        type: briefingType,
        forceRegenerate: true,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (corridor === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!corridor) {
    return (
      <div className="border-4 border-black bg-gray-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
        <Volume2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">{t("noCorridor")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
        <h1 className="text-2xl font-black mb-4">{t("title")}</h1>

        {/* Type Selector */}
        <BriefingTypeSelector selected={briefingType} onChange={setBriefingType} />
      </div>

      {/* Player Section */}
      {briefing ? (
        <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0_0_#000]">
          {/* Last Generated */}
          <div className="text-sm text-gray-500 mb-4">
            {t("lastGenerated", {
              time: formatDistanceToNow(new Date(briefing.createdAt), {
                addSuffix: true,
              }),
            })}
          </div>

          {/* Audio Player */}
          {briefing.audioStatus === "ready" && briefing.audioUrl ? (
            <AudioPlayer audioUrl={briefing.audioUrl} duration={briefing.audioDuration} />
          ) : briefing.audioStatus === "pending" ? (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">{t("generatingAudio")}</p>
            </div>
          ) : (
            <div className="text-center py-8 bg-red-50 border-2 border-red-300">
              <p className="text-red-600 mb-4">{t("audioFailed")}</p>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-black text-white font-bold hover:bg-gray-800 transition-colors"
              >
                {t("retry")}
              </button>
            </div>
          )}

          {/* Transcript Toggle */}
          <div className="mt-6 border-t-2 border-gray-200 pt-4">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-blue-600 font-bold hover:underline"
            >
              {showTranscript ? t("hideTranscript") : t("showTranscript")}
            </button>

            {showTranscript && <Transcript text={briefing.script} className="mt-4" />}
          </div>

          {/* Generate New */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`
              mt-6 w-full py-3 border-4 border-black font-bold transition-colors
              ${isGenerating ? "bg-gray-200 cursor-not-allowed" : "bg-yellow-400 hover:bg-yellow-300"}
            `}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("generating")}
              </span>
            ) : (
              t("generateNew")
            )}
          </button>
        </div>
      ) : (
        <div className="border-4 border-black bg-yellow-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
          <Volume2 className="w-16 h-16 mx-auto mb-4 text-yellow-600" />
          <p className="text-gray-700 mb-6">{t("noBriefing")}</p>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`
              px-6 py-3 font-bold transition-colors
              ${isGenerating ? "bg-gray-400 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800"}
            `}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t("generating")}
              </span>
            ) : (
              t("generateFirst")
            )}
          </button>
        </div>
      )}
    </div>
  );
}
