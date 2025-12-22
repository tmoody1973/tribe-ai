"use client";

import {
  Globe2,
  Users,
  Shield,
  Zap,
  Languages,
  MessageSquare,
  FileCheck,
  Lightbulb
} from "lucide-react";

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
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
    icon: <Users className="w-6 h-6" />,
    title: "Real Community Wisdom",
    description: "Advice from people who've actually made the move, not just official guides.",
    color: "text-green-600",
    bgColor: "bg-green-100 border-l-green-500",
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
    icon: <Languages className="w-6 h-6" />,
    title: "9 Languages",
    description: "English, Spanish, Portuguese, French, German, Hindi, Korean, Tagalog, Yoruba.",
    color: "text-purple-600",
    bgColor: "bg-purple-100 border-l-purple-500",
  },
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Ask TRIBE Anything",
    description: "Got a specific question? Our AI assistant knows your corridor inside out.",
    color: "text-cyan-600",
    bgColor: "bg-cyan-100 border-l-cyan-500",
  },
  {
    icon: <FileCheck className="w-6 h-6" />,
    title: "Step-by-Step Protocols",
    description: "Not just what to do, but in what order. Prioritized checklists you can trust.",
    color: "text-orange-600",
    bgColor: "bg-orange-100 border-l-orange-500",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Always Up-to-Date",
    description: "Immigration rules change. We keep researching so your info stays fresh.",
    color: "text-pink-600",
    bgColor: "bg-pink-100 border-l-pink-500",
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
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
              `}
            >
              <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center
                bg-white border-2 border-black mb-4
                group-hover:rotate-6 transition-transform
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
