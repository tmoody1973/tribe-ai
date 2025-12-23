"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UseVoiceResponseReturn {
  /** ID of the message currently being spoken */
  speakingMessageId: string | null;
  /** Whether audio is being generated */
  isLoading: boolean;
  /** Error message if TTS failed */
  error: string | null;
  /** Start speaking a message */
  speak: (messageId: string, text: string, language: string) => Promise<void>;
  /** Stop current playback */
  stop: () => void;
}

export function useVoiceResponse(): UseVoiceResponseReturn {
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateAudio = useAction(api.ai.responseTTS.generateResponseAudio);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const speak = useCallback(
    async (messageId: string, text: string, language: string) => {
      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Clear any previous error
      setError(null);
      setIsLoading(true);
      setSpeakingMessageId(messageId);

      try {
        // Generate audio via Convex action
        const { audioUrl } = await generateAudio({ text, language });

        if (!audioUrl) {
          throw new Error("No audio URL returned");
        }

        // Create and play audio
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.onended = () => {
          setSpeakingMessageId(null);
          audioRef.current = null;
        };

        audio.onerror = () => {
          setError("Audio playback failed");
          setSpeakingMessageId(null);
          audioRef.current = null;
        };

        setIsLoading(false);
        await audio.play();
      } catch (err) {
        console.error("TTS error:", err);
        setError(err instanceof Error ? err.message : "TTS generation failed");
        setSpeakingMessageId(null);
        setIsLoading(false);
      }
    },
    [generateAudio]
  );

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeakingMessageId(null);
    setIsLoading(false);
  }, []);

  return {
    speakingMessageId,
    isLoading,
    error,
    speak,
    stop,
  };
}
