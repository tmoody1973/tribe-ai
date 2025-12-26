"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  Briefcase,
} from "lucide-react";

interface ResearchStreamProps {
  corridorId: Id<"corridors">;
  origin: string;
  destination: string;
}

interface ResearchStep {
  id: string;
  icon: React.ReactNode;
  label: string;
  status: "pending" | "active" | "complete";
  detail?: string;
  sources?: string[];
}

const sourceIcons: Record<string, React.ReactNode> = {
  reddit: <MessageSquare size={14} className="text-orange-500" />,
  government: <Building size={14} className="text-blue-600" />,
  forum: <Users size={14} className="text-green-600" />,
  news: <FileText size={14} className="text-purple-600" />,
  jobs: <Briefcase size={14} className="text-indigo-600" />,
};

export function ResearchStream({ corridorId, origin, destination }: ResearchStreamProps) {
  const corridor = useQuery(api.corridors.getCorridor, { id: corridorId });
  const [steps, setSteps] = useState<ResearchStep[]>([]);
  const [currentSource, setCurrentSource] = useState<string | null>(null);
  const [foundSources, setFoundSources] = useState<string[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const streamRef = useRef<HTMLDivElement>(null);

  const isResearching = corridor?.researchStatus === "refreshing";

  // Simulate research progress for visual effect
  useEffect(() => {
    if (!isResearching) {
      setSteps([]);
      setCurrentSource(null);
      setFoundSources([]);
      setInsights([]);
      return;
    }

    const researchSteps: ResearchStep[] = [
      {
        id: "init",
        icon: <Search size={18} />,
        label: "Initializing corridor research",
        status: "pending",
        detail: `Analyzing ${origin} → ${destination} migration path`,
      },
      {
        id: "reddit",
        icon: <MessageSquare size={18} />,
        label: "Searching Reddit experiences",
        status: "pending",
        detail: "r/IWantOut, r/expats, r/immigration",
        sources: ["reddit.com/r/IWantOut", "reddit.com/r/expats"],
      },
      {
        id: "government",
        icon: <Building size={18} />,
        label: "Checking official sources",
        status: "pending",
        detail: "Embassy sites, visa portals",
        sources: ["Official visa requirements", "Embassy guidelines"],
      },
      {
        id: "forums",
        icon: <Users size={18} />,
        label: "Analyzing expat forums",
        status: "pending",
        detail: "InterNations, ExpatForum",
        sources: ["Expat community insights", "Local tips"],
      },
      {
        id: "news",
        icon: <FileText size={18} />,
        label: "Finding recent updates",
        status: "pending",
        detail: "Policy changes, visa news",
        sources: ["Recent policy updates", "Immigration news"],
      },
      {
        id: "synthesis",
        icon: <Sparkles size={18} />,
        label: "AI synthesizing protocols",
        status: "pending",
        detail: "Creating personalized action items",
      },
    ];

    setSteps(researchSteps);

    // Animate through steps
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

      const currentStep = researchSteps[stepIndex];
      if (currentStep.sources) {
        // Simulate finding sources
        currentStep.sources.forEach((source, sourceIndex) => {
          setTimeout(() => {
            setFoundSources((prev) => [...prev, source]);
            setCurrentSource(source);
          }, sourceIndex * 800);
        });
      }

      // Add insights periodically
      if (stepIndex === 2) {
        setTimeout(() => {
          setInsights((prev) => [...prev, "Found 23 relevant visa discussions"]);
        }, 500);
      }
      if (stepIndex === 3) {
        setTimeout(() => {
          setInsights((prev) => [...prev, "Identified key cost of living factors"]);
        }, 500);
      }
      if (stepIndex === 4) {
        setTimeout(() => {
          setInsights((prev) => [...prev, "Processing housing market data"]);
        }, 500);
      }

      stepIndex++;
    }, 2500);

    return () => clearInterval(stepInterval);
  }, [isResearching, origin, destination]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [steps, foundSources, insights]);

  if (!isResearching) return null;

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
      </div>

      {/* Stream Content */}
      <div ref={streamRef} className="p-4 max-h-96 overflow-y-auto font-mono text-sm">
        {/* Research Steps */}
        <div className="space-y-3 mb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 transition-opacity duration-300 ${
                step.status === "pending" ? "opacity-40" : "opacity-100"
              }`}
            >
              <div
                className={`p-1.5 rounded ${
                  step.status === "complete"
                    ? "bg-green-500"
                    : step.status === "active"
                    ? "bg-yellow-500 animate-pulse"
                    : "bg-gray-600"
                }`}
              >
                {step.status === "complete" ? (
                  <CheckCircle size={18} />
                ) : step.status === "active" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  step.icon
                )}
              </div>
              <div className="flex-1">
                <p className={step.status === "active" ? "text-yellow-400" : "text-gray-300"}>
                  {step.label}
                </p>
                {step.detail && (
                  <p className="text-xs text-gray-500">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Found Sources */}
        {foundSources.length > 0 && (
          <div className="border-t border-gray-700 pt-3 mt-3">
            <p className="text-xs text-gray-400 mb-2">Sources discovered:</p>
            <div className="flex flex-wrap gap-2">
              {foundSources.map((source, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 bg-gray-800 border border-gray-600 px-2 py-1 text-xs rounded animate-fadeIn"
                >
                  {sourceIcons[source.includes("reddit") ? "reddit" : "forum"] || (
                    <Globe size={12} />
                  )}
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Live Insights */}
        {insights.length > 0 && (
          <div className="border-t border-gray-700 pt-3 mt-3">
            <p className="text-xs text-gray-400 mb-2">AI Insights:</p>
            <div className="space-y-1">
              {insights.map((insight, i) => (
                <div key={i} className="flex items-center gap-2 text-green-400 text-xs">
                  <Sparkles size={12} />
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Activity */}
        {currentSource && (
          <div className="border-t border-gray-700 pt-3 mt-3">
            <div className="flex items-center gap-2 text-blue-400">
              <Search size={14} className="animate-pulse" />
              <span className="text-xs">Currently analyzing: {currentSource}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-700 bg-gray-900 px-4 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          Powered by Perplexity Sonar + Gemini AI
        </span>
        <span className="text-xs text-gray-500">
          {foundSources.length} sources found
        </span>
      </div>
    </div>
  );
}
