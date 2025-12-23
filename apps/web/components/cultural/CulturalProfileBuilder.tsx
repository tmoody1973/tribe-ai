"use client";

import { useState, useRef, useEffect } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslations } from "next-intl";
import { Send, Loader2, RefreshCw } from "lucide-react";

interface InterviewState {
  questionNumber: number;
  responses: Record<string, string>;
  currentQuestion: string;
  isComplete: boolean;
}

interface Message {
  role: "ai" | "user";
  content: string;
}

export function CulturalProfileBuilder() {
  const t = useTranslations("cultural");
  const startInterview = useAction(api.cultural.interview.startInterview);
  const continueInterview = useAction(api.cultural.interview.continueInterview);
  const resetInterview = useAction(api.cultural.interview.resetInterview);

  const [state, setState] = useState<InterviewState | null>(null);
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      const result = await startInterview({});
      setState(result);
      setMessages([{ role: "ai", content: result.currentQuestion }]);
    } catch (error) {
      console.error("Failed to start interview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm(t("confirmReset"))) return;

    setIsLoading(true);
    try {
      const result = await resetInterview({});
      setState(result);
      setMessages([{ role: "ai", content: result.currentQuestion }]);
    } catch (error) {
      console.error("Failed to reset interview:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!state || !answer.trim() || isLoading) return;

    const userAnswer = answer.trim();
    setAnswer("");
    setMessages((prev) => [...prev, { role: "user", content: userAnswer }]);
    setIsLoading(true);

    try {
      const result = await continueInterview({
        previousAnswer: userAnswer,
        questionNumber: state.questionNumber,
        responses: state.responses,
      });

      setState(result);
      setMessages((prev) => [...prev, { role: "ai", content: result.currentQuestion }]);
    } catch (error) {
      console.error("Failed to continue interview:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: t("interviewError") },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Initial state - not started
  if (!state) {
    return (
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_#000] text-center">
        <div className="text-6xl mb-4">🌍</div>
        <h2 className="font-head text-2xl mb-4">{t("buildProfile")}</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {t("profileDescription")}
        </p>
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="bg-amber-400 border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              {t("loading")}
            </span>
          ) : (
            t("startInterview")
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000]">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 border-b-4 border-black p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">{t("culturalInterview")}</span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium bg-white/50 px-2 py-1 rounded">
              {state.isComplete
                ? t("complete")
                : `${t("question")} ${state.questionNumber} / 10`}
            </span>
            {state.isComplete && (
              <button
                onClick={handleReset}
                disabled={isLoading}
                className="flex items-center gap-1 text-sm bg-white/50 px-2 py-1 rounded hover:bg-white/70"
                title={t("startOver")}
              >
                <RefreshCw size={14} />
                {t("startOver")}
              </button>
            )}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-3 bg-white/30 border-2 border-black rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${state.isComplete ? 100 : (state.questionNumber / 10) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-4 border-3 border-black ${
                msg.role === "user"
                  ? "bg-cyan-100 shadow-[3px_3px_0_0_#000]"
                  : "bg-amber-100 shadow-[3px_3px_0_0_#000]"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 p-4 border-3 border-black rounded-lg">
              <Loader2 className="animate-spin" size={20} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!state.isComplete && (
        <div className="border-t-4 border-black p-4 bg-white">
          <div className="flex gap-2">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("typeYourAnswer")}
              rows={2}
              className="flex-1 border-4 border-black p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !answer.trim()}
              className="bg-green-500 border-4 border-black p-3 shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{t("pressEnterToSend")}</p>
        </div>
      )}

      {/* Completion Actions */}
      {state.isComplete && (
        <div className="border-t-4 border-black p-4 bg-green-50 text-center">
          <p className="text-green-700 font-medium mb-3">
            {t("profileCreated")}
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-green-500 text-white border-4 border-black px-6 py-2 font-bold shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {t("viewDashboard")}
          </a>
        </div>
      )}
    </div>
  );
}
