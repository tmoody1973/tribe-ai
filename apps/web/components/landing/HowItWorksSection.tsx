"use client";

import { ArrowDown, MapPin, Brain, CheckCircle, Sparkles } from "lucide-react";

interface Step {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const steps: Step[] = [
  {
    number: 1,
    icon: <MapPin className="w-8 h-8" />,
    title: "Tell us your journey",
    description: "Where you're from, where you're going, and what stage you're at. Takes 30 seconds.",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  {
    number: 2,
    icon: <Brain className="w-8 h-8" />,
    title: "We research everything",
    description: "Our AI scours Reddit, forums, government sites, and diaspora communities for real experiences.",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  {
    number: 3,
    icon: <CheckCircle className="w-8 h-8" />,
    title: "Get your personalized protocol",
    description: "Step-by-step guidance with warnings, pro tips, and community-verified advice.",
    color: "text-green-600",
    bgColor: "bg-green-100",
  },
  {
    number: 4,
    icon: <Sparkles className="w-8 h-8" />,
    title: "Ask anything, anytime",
    description: "Chat with TRIBE AI for instant answers about visas, housing, banking, and more.",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
  },
];

interface HowItWorksSectionProps {
  title: string;
  subtitle: string;
}

export function HowItWorksSection({ title, subtitle }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-200 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-head text-4xl md:text-5xl mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="absolute left-8 top-24 bottom-0 w-1 bg-gradient-to-b from-gray-300 to-transparent hidden md:block" />
              )}

              <div className="flex gap-6 mb-8 md:mb-12">
                {/* Number bubble */}
                <div className={`
                  w-16 h-16 rounded-full flex-shrink-0
                  flex items-center justify-center
                  border-4 border-black shadow-[4px_4px_0_0_#000]
                  ${step.bgColor} ${step.color}
                  font-bold text-2xl
                  relative z-10
                `}>
                  {step.number}
                </div>

                {/* Content card */}
                <div className={`
                  flex-1 p-6 border-4 border-black
                  shadow-[6px_6px_0_0_#000]
                  hover:shadow-[3px_3px_0_0_#000]
                  hover:translate-x-[3px] hover:translate-y-[3px]
                  transition-all duration-200
                  ${step.bgColor}
                `}>
                  <div className={`${step.color} mb-3`}>
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-xl mb-2">{step.title}</h3>
                  <p className="text-gray-700">{step.description}</p>
                </div>
              </div>

              {/* Arrow between steps */}
              {i < steps.length - 1 && (
                <div className="flex justify-center mb-4 md:hidden">
                  <ArrowDown className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
