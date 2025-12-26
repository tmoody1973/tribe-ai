"use client";

import {
  Globe2,
  Users,
  Shield,
  Zap,
  Languages,
  MessageSquare,
  FileCheck,
  Lightbulb,
  Mic,
  FolderLock,
  LayoutGrid,
  Calculator,
} from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  badge?: string;
}

const features: Feature[] = [
  {
    icon: <Globe2 className="w-6 h-6" />,
    title: "Any Corridor, Any Country",
    description: "Moving from Nigeria to Germany? Brazil to Japan? We've got you covered.",
    color: "text-blue-600",
    bgColor: "bg-blue-100 border-l-blue-500",
  },
  {
    icon: <LayoutGrid className="w-6 h-6" />,
    title: "Kanban Task Board",
    description: "Drag-and-drop task management. Track your migration to-dos like a pro.",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100 border-l-cyan-500",
    badge: "New",
  },
  {
    icon: <FolderLock className="w-6 h-6" />,
    title: "Document Vault",
    description: "Securely store passports, visas, and important docs. Access anywhere.",
    color: "text-amber-600",
    bgColor: "bg-amber-100 border-l-amber-500",
    badge: "New",
  },
  {
    icon: <Mic className="w-6 h-6" />,
    title: "Voice Chat",
    description: "Talk to TRIBE in your language. Ask questions, get spoken answers.",
    color: "text-pink-600",
    bgColor: "bg-pink-100 border-l-pink-500",
    badge: "New",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Warnings & Gotchas",
    description: "Know the traps before you fall into them. We highlight what to watch out for.",
    color: "text-red-600",
    bgColor: "bg-red-100 border-l-red-500",
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: "Insider Tips & Hacks",
    description: "The stuff that saves you time, money, and headaches. Community-sourced gold.",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100 border-l-yellow-500",
  },
  {
    icon: <Calculator className="w-6 h-6" />,
    title: "True Cost Calculator",
    description: "Compare rent, groceries, and transport costs between countries. Know before you go.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 border-l-emerald-500",
    badge: "New",
  },
  {
    icon: <Languages className="w-6 h-6" />,
    title: "9 Languages",
    description: "English, Spanish, Portuguese, French, German, Hindi, Korean, Tagalog, Yoruba.",
    color: "text-purple-600",
    bgColor: "bg-purple-100 border-l-purple-500",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "AI Step Assistant",
    description: "Get personalized help on every protocol step. Your AI migration expert.",
    color: "text-indigo-600",
    bgColor: "bg-indigo-100 border-l-indigo-500",
    badge: "New",
  },
  {
    icon: <FileCheck className="w-6 h-6" />,
    title: "Document Checklists",
    description: "AI-generated lists of required documents for each step. Never miss a paper.",
    color: "text-orange-600",
    bgColor: "bg-orange-100 border-l-orange-500",
    badge: "New",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Real Community Wisdom",
    description: "Advice from people who've actually made the move, not just official guides.",
    color: "text-green-600",
    bgColor: "bg-green-100 border-l-green-500",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Always Up-to-Date",
    description: "Immigration rules change. We keep researching so your info stays fresh.",
    color: "text-rose-600",
    bgColor: "bg-rose-100 border-l-rose-500",
  },
];

interface FeaturesSectionProps {
  title: string;
  subtitle: string;
}

export function FeaturesSection({ title, subtitle }: FeaturesSectionProps) {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-head text-4xl md:text-5xl mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`
                ${feature.bgColor}
                border-4 border-black border-l-8 p-5
                shadow-[4px_4px_0_0_#000]
                hover:shadow-[2px_2px_0_0_#000]
                hover:translate-x-[2px] hover:translate-y-[2px]
                transition-all duration-200
                group
                relative
              `}
            >
              {/* New badge */}
              {feature.badge && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-2 py-1 border-2 border-black shadow-[2px_2px_0_0_#000] rotate-3">
                  {feature.badge}
                </div>
              )}
              <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center
                bg-white border-2 border-black mb-4
                group-hover:rotate-6 group-hover:scale-110 transition-transform
                ${feature.color}
              `}>
                {feature.icon}
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-700 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
