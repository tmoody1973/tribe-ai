"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Volume2, Loader2, X } from "lucide-react";
import { useVoiceResponse } from "@/hooks/useVoiceResponse";

interface VoiceChatProps {
  language?: string;
  onClose?: () => void;
}

type VoiceState = "idle" | "listening" | "processing" | "speaking";

export function VoiceChat({ language = "en", onClose }: VoiceChatProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messageIdRef = useRef(0);

  // Use the voice response hook for TTS
  const { speak, stop: stopTTS, speakingMessageId, isLoading: isSpeaking } = useVoiceResponse();

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      stopTTS();
    };
  }, [stopTTS]);

  // Sync state with TTS hook
  useEffect(() => {
    if (state === "speaking" && !speakingMessageId && !isSpeaking) {
      setState("idle");
    }
  }, [state, speakingMessageId, isSpeaking]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        // Process audio
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        });

        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setState("listening");
      setTranscript("");
      setResponse("");

    } catch (err) {
      console.error("Microphone error:", err);
      setError("Could not access microphone. Please check permissions.");
      setState("idle");
    }
  }, [processAudio]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setState("processing");
    }
  }, []);

  const processAudio = useCallback(async (audioBlob: Blob) => {
    try {
      setState("processing");

      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("language", language);

      const res = await fetch("/api/voice", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to process audio");
      }

      const data = await res.json();

      if (data.transcription) {
        setTranscript(data.transcription);
      }

      if (data.detectedLanguage) {
        setDetectedLanguage(data.detectedLanguage);
      }

      setResponse(data.text);

      // Speak the response in the detected language
      const responseLanguage = data.detectedLanguage || language;
      setState("speaking");
      messageIdRef.current += 1;
      const messageId = `voice-response-${messageIdRef.current}`;
      await speak(messageId, data.text, responseLanguage);
      setState("idle");

    } catch (err) {
      console.error("Processing error:", err);
      setError("Failed to process your voice. Please try again.");
      setState("idle");
    }
  }, [language, speak]);

  const _speakResponse = useCallback(async (text: string, lang: string) => {
    try {
      setState("speaking");
      messageIdRef.current += 1;
      const messageId = `voice-response-${messageIdRef.current}`;

      // Use the voice response hook to speak
      await speak(messageId, text, lang);
      setState("idle");
    } catch (err) {
      console.error("TTS error:", err);
      // If TTS fails, just show the text
      setState("idle");
    }
  }, [speak]);

  const stopSpeaking = useCallback(() => {
    stopTTS();
    setState("idle");
  }, [stopTTS]);

  const handleMainAction = () => {
    switch (state) {
      case "idle":
        startListening();
        break;
      case "listening":
        stopListening();
        break;
      case "speaking":
        stopSpeaking();
        break;
    }
  };

  const getStateText = () => {
    switch (state) {
      case "idle":
        return "Tap to speak";
      case "listening":
        return "Listening... tap to stop";
      case "processing":
        return "Processing...";
      case "speaking":
        return "Speaking... tap to stop";
    }
  };

  const getStateColor = () => {
    switch (state) {
      case "idle":
        return "bg-blue-500 hover:bg-blue-600";
      case "listening":
        return "bg-red-500 hover:bg-red-600 animate-pulse";
      case "processing":
        return "bg-yellow-500";
      case "speaking":
        return "bg-green-500 hover:bg-green-600";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] p-8 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Voice Chat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 border-2 border-black"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Button */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleMainAction}
            disabled={state === "processing"}
            className={`
              w-32 h-32 rounded-full flex items-center justify-center
              border-4 border-black shadow-[4px_4px_0_0_#000]
              transition-all duration-200
              ${getStateColor()}
              ${state === "processing" ? "cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {state === "processing" ? (
              <Loader2 size={48} className="animate-spin text-white" />
            ) : state === "speaking" ? (
              <Volume2 size={48} className="text-white" />
            ) : state === "listening" ? (
              <MicOff size={48} className="text-white" />
            ) : (
              <Mic size={48} className="text-white" />
            )}
          </button>

          <p className="text-lg font-medium text-gray-700">
            {getStateText()}
          </p>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="mt-6 p-4 bg-gray-100 border-2 border-black">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-500">You said:</p>
              {detectedLanguage && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                  {detectedLanguage.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-gray-800">{transcript}</p>
          </div>
        )}

        {/* Response */}
        {response && (
          <div className="mt-4 p-4 bg-blue-50 border-2 border-black">
            <p className="text-sm text-blue-600 mb-1">TRIBE:</p>
            <p className="text-gray-800">{response}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-500">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Ask me anything about your migration journey!</p>
        </div>
      </div>
    </div>
  );
}
