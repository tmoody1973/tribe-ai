"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { RecordingIndicator } from "./RecordingIndicator";
import { isWebSpeechSupported, getSpeechLang } from "@/lib/elevenlabs";

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

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
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check support on mount
  useEffect(() => {
    setIsSupported(isWebSpeechSupported());
  }, []);

  // Initialize speech recognition
  const initRecognition = useCallback(() => {
    if (typeof window === "undefined") return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = getSpeechLang(language);

    return recognition;
  }, [language]);

  const startRecording = useCallback(async () => {
    if (disabled || !isSupported) return;

    setError(null);
    setInterimText("");

    const recognition = initRecognition();
    if (!recognition) {
      setError("Speech recognition not supported");
      return;
    }

    recognitionRef.current = recognition;
    startTimeRef.current = Date.now();

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
      }

      if (finalTranscript.trim()) {
        onTranscription(finalTranscript.trim());
        setInterimText("");
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setError(t("microphoneError"));
      } else if (event.error !== "aborted") {
        setError(t("transcriptionFailed"));
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimText("");
    };

    try {
      recognition.start();
    } catch (err) {
      console.error("Failed to start recognition:", err);
      setError(t("microphoneError"));
    }
  }, [disabled, isSupported, initRecognition, onTranscription, t]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsRecording(false);
    }
  }, [isRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isRecording) {
      stopRecording();
    }
  }, [isRecording, stopRecording]);

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-3 border-4 border-black bg-gray-200 opacity-50 cursor-not-allowed"
        title="Speech recognition not supported in this browser"
      >
        <MicOff size={24} />
      </button>
    );
  }

  return (
    <div className="relative">
      {/* Recording Indicator */}
      {isRecording && <RecordingIndicator startTime={startTimeRef.current} />}

      {/* Interim Text Preview */}
      {interimText && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-blue-100 border-2 border-blue-400 text-blue-700 text-xs max-w-[200px] truncate rounded">
          {interimText}
        </div>
      )}

      {/* Voice Button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={handleMouseLeave}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={disabled}
        className={`
          p-3 border-4 border-black font-bold
          transition-all duration-150
          ${isRecording ? "bg-red-500 text-white scale-110" : "bg-white hover:bg-gray-100"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
        title={t("holdToSpeak")}
        aria-label={t("holdToSpeak")}
      >
        {isRecording ? (
          <Loader2 size={24} className="animate-spin" />
        ) : (
          <Mic size={24} />
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
