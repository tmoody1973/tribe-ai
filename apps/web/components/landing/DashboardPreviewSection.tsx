"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/retroui/Button";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  LayoutGrid,
  FolderOpen,
  MessageSquare,
  Map,
  Sparkles,
} from "lucide-react";

interface DashboardPreviewSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
}

export function DashboardPreviewSection({ title, subtitle, ctaText }: DashboardPreviewSectionProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  // Auto-rotate tabs
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulate step completion animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (completedSteps.length < 3) {
        setCompletedSteps((prev) => [...prev, prev.length]);
      }
    }, 2000);
    return () => clearTimeout(timeout);
  }, [completedSteps]);

  const tabs = [
    { icon: <Map size={16} />, label: "Journey" },
    { icon: <LayoutGrid size={16} />, label: "Tasks" },
    { icon: <FolderOpen size={16} />, label: "Documents" },
    { icon: <MessageSquare size={16} />, label: "Ask AI" },
  ];

  const protocols = [
    { title: "Get passport photos", category: "visa", completed: completedSteps.includes(0) },
    { title: "Book embassy appointment", category: "visa", completed: completedSteps.includes(1) },
    { title: "Gather bank statements", category: "finance", completed: completedSteps.includes(2) },
    { title: "Research housing options", category: "housing", completed: false },
    { title: "Open local bank account", category: "finance", completed: false },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-orange-200/30 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-100 to-blue-100 border-2 border-black px-4 py-2 mb-6 shadow-[3px_3px_0_0_#000]">
            <Sparkles className="w-4 h-4 text-cyan-600" />
            <span className="font-bold text-sm">See It In Action</span>
          </div>
          <h2 className="font-head text-4xl md:text-5xl mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Dashboard mockup */}
        <div className="max-w-5xl mx-auto">
          <div className="border-4 border-black bg-white shadow-[12px_12px_0_0_#000] rounded-lg overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-gray-100 border-b-4 border-black px-4 py-3 flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 border border-black" />
                <div className="w-3 h-3 rounded-full bg-yellow-500 border border-black" />
                <div className="w-3 h-3 rounded-full bg-green-500 border border-black" />
              </div>
              <div className="flex-1 bg-white border-2 border-black px-3 py-1 text-sm text-gray-500 rounded">
                tribe.ai/dashboard
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6 bg-gradient-to-br from-amber-50/50 to-cyan-50/50">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-xl">Nigeria → Germany</h3>
                  <p className="text-gray-600 text-sm">Stage: Planning</p>
                </div>
                <div className="flex gap-2">
                  {tabs.map((tab, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveTab(i)}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold
                        border-2 border-black transition-all
                        ${activeTab === i
                          ? "bg-black text-white"
                          : "bg-white hover:bg-gray-100"
                        }
                      `}
                    >
                      {tab.icon}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content based on active tab */}
              <div className="grid md:grid-cols-3 gap-6">
                {/* Protocols column */}
                <div className="md:col-span-2">
                  <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000]">
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 border-b-4 border-black p-4">
                      <h4 className="font-bold">Your Migration Protocol</h4>
                      <p className="text-sm text-gray-600">3 of 5 steps completed</p>
                    </div>
                    <div className="p-4 space-y-3">
                      {protocols.map((protocol, i) => (
                        <div
                          key={i}
                          className={`
                            flex items-center gap-3 p-3 border-2 border-black
                            transition-all duration-500
                            ${protocol.completed
                              ? "bg-green-50 border-l-4 border-l-green-500"
                              : "bg-white hover:bg-gray-50"
                            }
                          `}
                        >
                          <div
                            className={`
                              w-8 h-8 flex items-center justify-center border-2 border-black
                              font-bold text-sm transition-all duration-500
                              ${protocol.completed
                                ? "bg-green-500 text-white"
                                : "bg-white"
                              }
                            `}
                          >
                            {protocol.completed ? <Check size={16} /> : i + 1}
                          </div>
                          <div className="flex-1">
                            <p className={`font-medium ${protocol.completed ? "line-through text-gray-400" : ""}`}>
                              {protocol.title}
                            </p>
                            <span className="text-xs text-gray-500 capitalize">{protocol.category}</span>
                          </div>
                          {!protocol.completed && (
                            <ChevronDown size={16} className="text-gray-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                  {/* Quick Stats */}
                  <div className="border-4 border-black bg-white shadow-[4px_4px_0_0_#000] p-4">
                    <h4 className="font-bold mb-3">Quick Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Visa Required</span>
                        <span className="font-bold">Yes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing</span>
                        <span className="font-bold">4-8 weeks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Language</span>
                        <span className="font-bold">German</span>
                      </div>
                    </div>
                  </div>

                  {/* Task Board Preview */}
                  <div className="border-4 border-black bg-gradient-to-br from-cyan-50 to-cyan-100 shadow-[4px_4px_0_0_#000] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <LayoutGrid size={18} className="text-cyan-600" />
                      <h4 className="font-bold">Task Board</h4>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <div className="flex-1 text-center">
                        <div className="font-bold text-lg text-gray-700">3</div>
                        <div className="text-gray-500">To Do</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="font-bold text-lg text-blue-600">2</div>
                        <div className="text-gray-500">In Progress</div>
                      </div>
                      <div className="flex-1 text-center">
                        <div className="font-bold text-lg text-green-600">5</div>
                        <div className="text-gray-500">Done</div>
                      </div>
                    </div>
                  </div>

                  {/* Document Vault Preview */}
                  <div className="border-4 border-black bg-gradient-to-br from-amber-50 to-amber-100 shadow-[4px_4px_0_0_#000] p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <FolderOpen size={18} className="text-amber-600" />
                      <h4 className="font-bold">Document Vault</h4>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-bold text-amber-700">4 documents</span> stored securely
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature highlights below mockup */}
          <div className="grid md:grid-cols-4 gap-4 mt-8">
            {[
              { emoji: "📋", label: "Step-by-step protocols" },
              { emoji: "📁", label: "Secure document storage" },
              { emoji: "✅", label: "Kanban task tracking" },
              { emoji: "🤖", label: "AI assistance on every step" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white border-2 border-black p-3 shadow-[3px_3px_0_0_#000]"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="font-medium text-sm">{item.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-10 py-5">
                {ctaText}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <p className="text-gray-500 mt-4 text-sm">
              Free to start. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
