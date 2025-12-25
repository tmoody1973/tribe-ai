"use client";

import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Bot, Send, Loader2, Volume2, Sparkles, ExternalLink } from "lucide-react";
import { useVoiceResponse } from "@/hooks/useVoiceResponse";
import ReactMarkdown from "react-markdown";

interface StepAssistantProps {
  protocolId: Id<"protocols">;
  corridorId: Id<"corridors">;
  stepTitle: string;
  stepDescription: string;
  stepCategory: string;
  stepPriority: string;
  warnings?: string[];
  hacks?: string[];
}

interface AssistantResponse {
  response: string;
  hasRagContent: boolean;
  sourcesCount: number;
  sources?: Array<{
    title: string;
    url: string;
    isCorridorSpecific: boolean;
  }>;
}

export function StepAssistant({
  corridorId,
  stepTitle,
  stepDescription,
  stepCategory,
  stepPriority,
  warnings,
  hacks,
}: StepAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const corridor = useQuery(api.corridors.getCorridor, { id: corridorId });
  const profile = useQuery(api.users.getProfile);
  const { speak, stop, speakingMessageId, isLoading: isSpeaking } = useVoiceResponse();

  const userLanguage = profile?.language ?? "en";

  const getAssistance = useCallback(async (userQuestion?: string) => {
    if (!corridor) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/step-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepContext: {
            stepTitle,
            stepDescription,
            stepCategory,
            stepPriority,
            warnings,
            hacks,
            corridorOrigin: corridor.origin,
            corridorDestination: corridor.destination,
          },
          corridorId,
          userQuestion,
          language: userLanguage,
        }),
      });

      if (!res.ok) throw new Error("Failed to get assistance");

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError("Could not get assistance. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [corridor, corridorId, stepTitle, stepDescription, stepCategory, stepPriority, warnings, hacks, userLanguage]);

  const handleOpen = () => {
    setIsOpen(true);
    if (!response) {
      getAssistance();
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    await getAssistance(question);
    setQuestion("");
  };

  const handleSpeak = () => {
    if (speakingMessageId) {
      stop();
    } else if (response?.response) {
      speak("step-assistant", response.response, userLanguage);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold border-2 border-black shadow-[2px_2px_0_0_#000] hover:shadow-[4px_4px_0_0_#000] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
      >
        <Sparkles size={18} />
        Ask AI About This Step
      </button>
    );
  }

  return (
    <div className="border-2 border-black bg-white shadow-[4px_4px_0_0_#000]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-b-2 border-black">
        <div className="flex items-center gap-2">
          <Bot size={20} />
          <span className="font-bold">Step Assistant</span>
          {response?.hasRagContent && (
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded">
              {response.sourcesCount} sources
            </span>
          )}
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/80 hover:text-white"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4 max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
            <Loader2 className="animate-spin" size={20} />
            <span>Getting personalized guidance...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : response ? (
          <div className="space-y-4">
            {/* Response */}
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{response.response}</ReactMarkdown>
            </div>

            {/* Sources */}
            {response.sources && response.sources.length > 0 && (
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Sources:</p>
                <div className="flex flex-wrap gap-2">
                  {response.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <ExternalLink size={12} />
                      {source.title.slice(0, 30)}...
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSpeak}
                disabled={isSpeaking}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm border-2 border-black ${
                  speakingMessageId
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <Volume2 size={14} />
                {speakingMessageId ? "Stop" : "Listen"}
              </button>
              <button
                onClick={() => getAssistance()}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border-2 border-black bg-gray-100 hover:bg-gray-200"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Question Input */}
      <form onSubmit={handleAskQuestion} className="p-3 border-t-2 border-black bg-gray-50">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a follow-up question..."
            className="flex-1 px-3 py-2 border-2 border-black text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            className="px-4 py-2 bg-black text-white font-bold disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
