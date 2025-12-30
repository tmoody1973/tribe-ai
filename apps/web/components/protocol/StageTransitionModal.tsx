"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Archive, Sparkles, Bookmark, ChevronRight, Loader2 } from "lucide-react";

type Stage = "dreaming" | "planning" | "preparing" | "relocating" | "settling";

interface StageTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: Stage;
  newStage: Stage;
  corridorId: Id<"corridors">;
  onConfirm: () => void;
}

const stageEmojis: Record<string, string> = {
  dreaming: "💭",
  planning: "📋",
  preparing: "📦",
  relocating: "✈️",
  settling: "🏡",
};

const stageLabels: Record<string, string> = {
  dreaming: "Dreaming",
  planning: "Planning",
  preparing: "Preparing",
  relocating: "Relocating",
  settling: "Settling",
};

export function StageTransitionModal({
  isOpen,
  onClose,
  currentStage,
  newStage,
  corridorId,
  onConfirm,
}: StageTransitionModalProps) {
  const t = useTranslations("protocols");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedToSave, setSelectedToSave] = useState<Set<string>>(new Set());

  // Get current active protocols
  const protocols = useQuery(api.protocolArchive.getActiveProtocols, {
    corridorId,
  });

  // Mutations
  const archiveProtocols = useMutation(api.protocolArchive.archiveProtocolsForStageChange);
  const saveProtocol = useMutation(api.protocolArchive.saveProtocol);

  if (!isOpen) return null;

  const handleToggleSave = (protocolId: string) => {
    const newSelected = new Set(selectedToSave);
    if (newSelected.has(protocolId)) {
      newSelected.delete(protocolId);
    } else {
      newSelected.add(protocolId);
    }
    setSelectedToSave(newSelected);
  };

  const handleConfirm = async () => {
    setIsTransitioning(true);
    try {
      // First, save any selected protocols
      const protocolsToSave = Array.from(selectedToSave);
      for (const protocolId of protocolsToSave) {
        await saveProtocol({ protocolId: protocolId as Id<"protocols"> });
      }

      // Then archive all current protocols
      await archiveProtocols({
        corridorId,
        previousStage: currentStage,
        newStage,
      });

      // Finally, call the parent's confirm handler to update the stage
      onConfirm();
    } catch (error) {
      console.error("Failed to transition stage:", error);
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white border-4 border-black shadow-[8px_8px_0_0_#000] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b-4 border-black bg-gradient-to-r from-yellow-400 to-orange-400">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black">
              {t("stageTransition.title", { newStage: stageLabels[newStage] })}
            </h2>
            <button
              onClick={onClose}
              disabled={isTransitioning}
              className="p-1 hover:bg-black/10 rounded"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stage Transition Visual */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 border-4 border-black flex items-center justify-center text-3xl">
                {stageEmojis[currentStage]}
              </div>
              <p className="mt-2 font-bold text-gray-600">{stageLabels[currentStage]}</p>
            </div>
            <ChevronRight size={32} className="text-gray-400" />
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-yellow-400 border-4 border-black flex items-center justify-center text-3xl">
                {stageEmojis[newStage]}
              </div>
              <p className="mt-2 font-bold">{stageLabels[newStage]}</p>
            </div>
          </div>

          {/* What will happen */}
          <div className="space-y-3">
            <p className="text-gray-700">{t("stageTransition.description")}</p>

            <div className="flex items-start gap-3 p-3 bg-blue-50 border-2 border-blue-200">
              <Archive className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-blue-800">Archive Current Protocols</p>
                <p className="text-sm text-blue-700">{t("stageTransition.archiveExplanation")}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 border-2 border-green-200">
              <Sparkles className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-bold text-green-800">Generate New Protocols</p>
                <p className="text-sm text-green-700">
                  {t("stageTransition.newProtocols", { newStage: stageLabels[newStage] })}
                </p>
              </div>
            </div>
          </div>

          {/* Save protocols before transition */}
          {protocols && protocols.length > 0 && (
            <div className="border-2 border-yellow-400 bg-yellow-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Bookmark className="text-yellow-600" size={20} />
                <p className="font-bold text-yellow-800">{t("stageTransition.saveReminder")}</p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {protocols.slice(0, 5).map((protocol: any) => (
                  <label
                    key={protocol._id}
                    className={`
                      flex items-center gap-3 p-2 cursor-pointer transition-colors
                      ${selectedToSave.has(protocol._id) ? "bg-yellow-200" : "hover:bg-yellow-100"}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={selectedToSave.has(protocol._id)}
                      onChange={() => handleToggleSave(protocol._id)}
                      className="w-4 h-4 accent-yellow-600"
                    />
                    <span className="text-sm font-medium">{protocol.title}</span>
                  </label>
                ))}
                {protocols.length > 5 && (
                  <p className="text-xs text-gray-500 pt-2">
                    +{protocols.length - 5} more protocols will be archived
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-4 border-black bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            disabled={isTransitioning}
            className="flex-1 py-3 px-4 font-bold border-4 border-black bg-white hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {t("stageTransition.cancel", { currentStage: stageLabels[currentStage] })}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isTransitioning}
            className="flex-1 py-3 px-4 font-bold border-4 border-black bg-yellow-400 hover:bg-yellow-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isTransitioning ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Transitioning...
              </>
            ) : (
              t("stageTransition.confirm")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
