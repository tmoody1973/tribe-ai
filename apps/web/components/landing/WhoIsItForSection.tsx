"use client";

import { Check } from "lucide-react";

interface Persona {
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  needs: string[];
  color: string;
  gradient: string;
}

const personas: Persona[] = [
  {
    emoji: "💭",
    title: "Dreamers",
    subtitle: "\"Someday, I'll move abroad...\"",
    description: "You're researching, comparing countries, wondering if it's even possible. You need clarity.",
    needs: [
      "Which country fits my goals?",
      "What visa options do I have?",
      "How much will it really cost?",
      "Is it even worth it?",
    ],
    color: "border-purple-500",
    gradient: "from-purple-100 to-purple-50",
  },
  {
    emoji: "📋",
    title: "Planners",
    subtitle: "\"I'm doing this. Now what?\"",
    description: "You've decided. Now you're drowning in paperwork, requirements, and conflicting info online.",
    needs: [
      "Document checklist",
      "Step-by-step process",
      "Common mistakes to avoid",
      "Realistic timelines",
    ],
    color: "border-blue-500",
    gradient: "from-blue-100 to-blue-50",
  },
  {
    emoji: "✈️",
    title: "Movers",
    subtitle: "\"The visa came through!\"",
    description: "It's real now. You need to pack your life, say goodbye, and prepare for day one in a new country.",
    needs: [
      "What to do first day",
      "Emergency contacts",
      "Must-haves to bring",
      "First week survival guide",
    ],
    color: "border-green-500",
    gradient: "from-green-100 to-green-50",
  },
  {
    emoji: "🏠",
    title: "Settlers",
    subtitle: "\"I made it. Now I'm lost.\"",
    description: "You're here! But opening a bank account, finding a place, getting a phone... it's all new and confusing.",
    needs: [
      "How to open bank account",
      "Finding affordable housing",
      "Building credit",
      "Making local friends",
    ],
    color: "border-orange-500",
    gradient: "from-orange-100 to-orange-50",
  },
];

interface WhoIsItForSectionProps {
  title: string;
  subtitle: string;
}

export function WhoIsItForSection({ title, subtitle }: WhoIsItForSectionProps) {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 text-8xl opacity-10 rotate-12">✈️</div>
      <div className="absolute bottom-20 right-10 text-8xl opacity-10 -rotate-12">🌍</div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-head text-4xl md:text-5xl mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Personas */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {personas.map((persona, i) => (
            <div
              key={i}
              className={`
                bg-gradient-to-br ${persona.gradient}
                border-4 ${persona.color} border-black
                shadow-[6px_6px_0_0_#000]
                overflow-hidden
                relative
              `}
            >
              {/* Background emoji */}
              <div className="absolute -right-6 -bottom-6 text-[120px] opacity-10">
                {persona.emoji}
              </div>

              <div className="p-8 relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-5xl">{persona.emoji}</span>
                  <div>
                    <h3 className="font-bold text-2xl">{persona.title}</h3>
                    <p className="text-gray-600 italic">{persona.subtitle}</p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-700 mb-6">{persona.description}</p>

                {/* Needs list */}
                <div className="space-y-2">
                  <p className="font-bold text-sm text-gray-500 uppercase">You need to know:</p>
                  {persona.needs.map((need, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-black flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-700">{need}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom message */}
        <div className="text-center mt-12">
          <p className="text-xl text-gray-600">
            <span className="font-bold">Sound familiar?</span> You&apos;re exactly who TRIBE was built for.
          </p>
        </div>
      </div>
    </section>
  );
}
