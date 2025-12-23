"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { RecordingIndicator } from "./RecordingIndicator";
import { speechToText } from "@/lib/elevenlabs";

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  language: string;
  disabled?: boolean;
}

export function VoiceInputButton({
  onTranscription,
  language,
  disabled = false,
}: VoiceInputButtonProps) {
  const t = useTranslations("chat.voice");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (disabled || isTranscribing) return;

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType });

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Only transcribe if we have audio data
        if (audioBlob.size > 0) {
          setIsTranscribing(true);
          try {
            const result = await speechToText(audioBlob, language);
            if (result.text.trim()) {
              onTranscription(result.text);
            }
          } catch (err) {
            console.error("STT error:", err);
            setError(t("transcriptionFailed"));
          } finally {
            setIsTranscribing(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone error:", err);
      setError(t("microphoneError"));
    }
  }, [disabled, isTranscribing, language, onTranscription, t]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Cleanup on unmount
  const handleMouseLeave = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  return (
    <div className="relative">
      {/* Recording Indicator */}
      {isRecording && <RecordingIndicator startTime={startTimeRef.current} />}

      {/* Voice Button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={handleMouseLeave}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={disabled || isTranscribing}
        className={`
          p-3 border-4 border-black font-bold
          transition-all duration-150
          ${isRecording ? "bg-red-500 text-white scale-110" : "bg-white hover:bg-gray-100"}
          ${disabled || isTranscribing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        title={t("holdToSpeak")}
        aria-label={t("holdToSpeak")}
      >
        {isTranscribing ? (
          <Loader2 size={24} className="animate-spin" />
        ) : (
          <Mic size={24} className={isRecording ? "animate-pulse" : ""} />
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-red-100 border-2 border-red-400 text-red-700 text-xs whitespace-nowrap rounded">
          {error}
        </div>
      )}
    </div>
  );
}
