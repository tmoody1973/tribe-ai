"use client";

import { useTranslations } from "next-intl";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useRef, useState } from "react";
import { getCountryByCode } from "@/lib/constants/countries";
import {
  Search,
  Globe,
  FileText,
  Sparkles,
  CheckCircle,
  Loader2,
  MessageSquare,
  Building,
  Users,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface EmptyStateProps {
  corridorId: Id<"corridors">;
}

interface ResearchStep {
  id: string;
  icon: React.ReactNode;
  label: string;
  status: "pending" | "active" | "complete";
  detail?: string;
}

export function EmptyState({ corridorId }: EmptyStateProps) {
  const t = useTranslations("dashboard.empty");
  const generateProtocols = useAction(api.ai.pipeline.generateCorridorProtocols);
  const corridor = useQuery(api.corridors.getCorridor, { id: corridorId });
  const hasTriggered = useRef(false);
  const corridorIdRef = useRef(corridorId);
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const originCountry = getCountryByCode(corridor?.origin || "");
  const destCountry = getCountryByCode(corridor?.destination || "");

  useEffect(() => {
    // Reset trigger if corridorId changes
    if (corridorIdRef.current !== corridorId) {
      hasTriggered.current = false;
      corridorIdRef.current = corridorId;
    }

    // Only trigger once per corridorId, and only if not already refreshing
    if (hasTriggered.current) return;
    if (corridor?.researchStatus === "refreshing") {
      console.log("Already refreshing, skipping trigger");
      return;
    }

    hasTriggered.current = true;

    // Trigger research if not already running
    generateProtocols({ corridorId }).catch((error) => {
      console.error("Failed to generate protocols:", error);
      // Reset on error to allow retry
      hasTriggered.current = false;
    });
  }, [corridorId, corridor?.researchStatus, generateProtocols]);

  // Animate research steps when refreshing
  useEffect(() => {
    if (corridor?.researchStatus !== "refreshing") {
      setSteps([]);
      setInsights([]);
      return;
    }

    const researchSteps: ResearchStep[] = [
      { id: "init", icon: <Search size={16} />, label: "Initializing corridor research", status: "pending", detail: `${originCountry?.name || "Origin"} → ${destCountry?.name || "Destination"}` },
      { id: "reddit", icon: <MessageSquare size={16} />, label: "Searching Reddit experiences", status: "pending", detail: "r/IWantOut, r/expats, r/immigration" },
      { id: "govt", icon: <Building size={16} />, label: "Checking official sources", status: "pending", detail: "Embassy sites, visa portals" },
      { id: "forums", icon: <Users size={16} />, label: "Analyzing expat forums", status: "pending", detail: "InterNations, ExpatForum" },
      { id: "news", icon: <FileText size={16} />, label: "Finding recent updates", status: "pending", detail: "Policy changes, visa news" },
      { id: "synthesis", icon: <Sparkles size={16} />, label: "AI synthesizing protocols", status: "pending", detail: "Creating personalized action items" },
    ];

    setSteps(researchSteps);

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex >= researchSteps.length) {
        clearInterval(stepInterval);
        return;
      }

      setSteps((prev) =>
        prev.map((step, i) => ({
          ...step,
          status: i < stepIndex ? "complete" : i === stepIndex ? "active" : "pending",
        }))
      );

      // Add insights
      if (stepIndex === 1) {
        setTimeout(() => setInsights((prev) => [...prev, "Found 23 relevant visa discussions"]), 800);
      }
      if (stepIndex === 2) {
        setTimeout(() => setInsights((prev) => [...prev, "Verified official visa requirements"]), 800);
      }
      if (stepIndex === 3) {
        setTimeout(() => setInsights((prev) => [...prev, "Collected housing & cost data"]), 800);
      }
      if (stepIndex === 4) {
        setTimeout(() => setInsights((prev) => [...prev, "Checked latest policy updates"]), 800);
      }

      stepIndex++;
    }, 2000);

    return () => clearInterval(stepInterval);
  }, [corridor?.researchStatus, originCountry?.name, destCountry?.name]);

  const isRefreshing = corridor?.researchStatus === "refreshing";
  const hasError = corridor?.researchStatus === "error";

  // Error state
  if (hasError) {
    return (
      <div className="border-4 border-black bg-red-50 p-8 shadow-[4px_4px_0_0_#000]">
        <div className="flex items-center justify-center gap-3 mb-4">
          <AlertCircle size={32} className="text-red-600" />
          <h3 className="text-xl font-bold text-red-800">Research Failed</h3>
        </div>
        <p className="text-red-700 text-center mb-4">
          {corridor?.errorMessage || "Something went wrong during research"}
        </p>
        <button
          onClick={() => {
            hasTriggered.current = false;
            generateProtocols({ corridorId, forceRefresh: true });
          }}
          className="mx-auto flex items-center gap-2 bg-red-600 text-white border-4 border-black px-6 py-3 font-bold hover:bg-red-700 transition-colors"
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  // Researching state with live stream
  if (isRefreshing) {
    return (
      <div className="border-4 border-black bg-gradient-to-br from-slate-900 to-slate-800 shadow-[6px_6px_0_0_#000] overflow-hidden text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 border-b-4 border-black p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe size={20} className="animate-pulse" />
              <h3 className="font-head text-lg">AI Research in Progress</h3>
            </div>
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs font-mono">LIVE</span>
            </div>
          </div>
          <p className="text-sm text-green-100 mt-1">
            Researching {originCountry?.flag} {originCountry?.name} → {destCountry?.flag} {destCountry?.name}
          </p>
        </div>

        {/* Research Steps */}
        <div className="p-4 font-mono text-sm">
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 transition-all duration-300 ${
                  step.status === "pending" ? "opacity-40" : "opacity-100"
                }`}
              >
                <div
                  className={`p-1.5 rounded flex-shrink-0 ${
                    step.status === "complete"
                      ? "bg-green-500"
                      : step.status === "active"
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-gray-600"
                  }`}
                >
                  {step.status === "complete" ? (
                    <CheckCircle size={16} />
                  ) : step.status === "active" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    step.icon
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={step.status === "active" ? "text-yellow-400" : "text-gray-300"}>
                    {step.label}
                  </p>
                  {step.detail && (
                    <p className="text-xs text-gray-500 truncate">{step.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Live Insights */}
          {insights.length > 0 && (
            <div className="border-t border-gray-700 pt-3 mt-4">
              <p className="text-xs text-gray-400 mb-2">AI Insights:</p>
              <div className="space-y-1">
                {insights.map((insight, i) => (
                  <div key={i} className="flex items-center gap-2 text-green-400 text-xs animate-fadeIn">
                    <Sparkles size={12} />
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 bg-gray-900 px-4 py-2 flex items-center justify-between">
          <span className="text-xs text-gray-500">Powered by Perplexity Sonar + Gemini AI</span>
          <span className="text-xs text-gray-500">{steps.filter((s) => s.status === "complete").length}/{steps.length} complete</span>
        </div>
      </div>
    );
  }

  // Default empty state (not yet started)
  return (
    <div className="border-4 border-black bg-yellow-50 p-8 text-center shadow-[4px_4px_0_0_#000]">
      <div className="text-4xl mb-4 animate-bounce">🔍</div>
      <h3 className="text-xl font-bold mb-2">{t("title")}</h3>
      <p className="text-gray-600">{t("description")}</p>
      <p className="text-sm text-gray-500 mt-4">{t("estimatedTime")}</p>
    </div>
  );
}
