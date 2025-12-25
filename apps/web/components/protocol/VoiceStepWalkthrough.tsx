"use client";

import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { useVoiceResponse } from "@/hooks/useVoiceResponse";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface VoiceStepWalkthroughProps {
  stepTitle: string;
  stepDescription: string;
}

export function VoiceStepWalkthrough({ stepTitle, stepDescription }: VoiceStepWalkthroughProps) {
  const { speak, stop, speakingMessageId, isLoading } = useVoiceResponse();
  const profile = useQuery(api.users.getProfile);
  const userLanguage = profile?.language ?? "en";

  const isSpeaking = speakingMessageId === "step-walkthrough";

  const handleClick = () => {
    if (isSpeaking) {
      stop();
    } else {
      const text = `Your current step is: ${stepTitle}. ${stepDescription}`;
      speak("step-walkthrough", text, userLanguage);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading && !isSpeaking}
      className={`
        w-full flex items-center justify-center gap-3 py-3 px-4
        border-4 border-black font-bold text-lg
        shadow-[4px_4px_0_0_#000] transition-all
        ${isSpeaking
          ? "bg-red-100 text-red-700 hover:bg-red-200"
          : "bg-yellow-100 hover:bg-yellow-200 hover:shadow-[6px_6px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px]"
        }
        ${isLoading && !isSpeaking ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {isLoading && !isSpeaking ? (
        <>
          <Loader2 size={24} className="animate-spin" />
          <span>Loading voice...</span>
        </>
      ) : isSpeaking ? (
        <>
          <VolumeX size={24} />
          <span>Stop Reading</span>
        </>
      ) : (
        <>
          <Volume2 size={24} />
          <span>Read Current Step Aloud</span>
        </>
      )}
    </button>
  );
}
