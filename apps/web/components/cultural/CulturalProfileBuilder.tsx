"use client";

import { useState, useRef, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  Send,
  Loader2,
  RefreshCw,
  CheckCircle2,
  MessageCircle,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
} from "lucide-react";

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

  // Fetch profile to show on completion
  const profile = useQuery(api.cultural.profile.getProfile);

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

  // Completion state - show profile summary
  if (state.isComplete) {
    return (
      <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000] overflow-hidden">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-400 to-emerald-400 border-b-4 border-black p-6 text-center">
          <CheckCircle2 size={48} className="mx-auto text-white mb-3" />
          <h2 className="font-head text-2xl text-white mb-1">{t("profileComplete")}</h2>
          <p className="text-white/80">{t("profileSaved")}</p>
        </div>

        {/* Thank You Message */}
        <div className="p-6 bg-green-50 border-b-4 border-black">
          <p className="text-gray-700 leading-relaxed">
            {messages[messages.length - 1]?.content || t("thankYouMessage")}
          </p>
        </div>

        {/* Profile Summary Preview */}
        {profile && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={20} className="text-amber-500" />
              <h3 className="font-bold text-lg">{t("yourProfileSummary")}</h3>
            </div>

            {/* Cultural Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 border-2 border-black">
                <div className="p-2 bg-blue-200 border-2 border-black">
                  <MessageCircle size={18} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">{t("communication")}</div>
                  <div className="font-bold">{t(`styles.${profile.communicationStyle}`)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-green-50 border-2 border-black">
                <div className="p-2 bg-green-200 border-2 border-black">
                  <Users size={18} className="text-green-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">{t("family")}</div>
                  <div className="font-bold">{t(`familyTypes.${profile.familyStructure}`)}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 border-2 border-black">
                <div className="p-2 bg-purple-200 border-2 border-black">
                  <Clock size={18} className="text-purple-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">{t("timeOrientation")}</div>
                  <div className="font-bold">{t(`timeTypes.${profile.timeOrientation}`)}</div>
                </div>
              </div>
            </div>

            {/* Values Tags */}
            {profile.values && profile.values.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-2">{t("coreValues")}</div>
                <div className="flex flex-wrap gap-2">
                  {profile.values.slice(0, 5).map((value: string, i: number) => (
                    <span
                      key={i}
                      className="bg-red-100 border-2 border-black px-2 py-1 text-sm font-medium"
                    >
                      {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Celebrations Tags */}
            {profile.celebrations && profile.celebrations.length > 0 && (
              <div>
                <div className="text-xs text-gray-500 uppercase mb-2">{t("celebrations")}</div>
                <div className="flex flex-wrap gap-2">
                  {profile.celebrations.slice(0, 4).map((item: string, i: number) => (
                    <span
                      key={i}
                      className="bg-yellow-100 border-2 border-black px-2 py-1 text-sm font-medium"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 bg-gray-50 border-t-4 border-black space-y-3">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-green-500 text-white border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            {t("viewDashboard")}
            <ArrowRight size={20} />
          </Link>

          <button
            onClick={handleReset}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-gray-200 border-4 border-black px-6 py-3 font-bold shadow-[4px_4px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
          >
            <RefreshCw size={18} />
            {t("startOver")}
          </button>
        </div>
      </div>
    );
  }

  // Interview in progress
  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0_0_#000]">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 border-b-4 border-black p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-bold text-lg">{t("culturalInterview")}</span>
          <span className="text-sm font-medium bg-white/50 px-2 py-1 rounded">
            {t("question")} {state.questionNumber} / 10
          </span>
        </div>
        {/* Progress Bar */}
        <div className="h-3 bg-white/30 border-2 border-black rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${(state.questionNumber / 10) * 100}%`,
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
    </div>
  );
}
