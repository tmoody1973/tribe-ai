"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/retroui/Button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

// Animated globe with migration paths
function AnimatedGlobe() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((r) => (r + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-80 h-80 md:w-96 md:h-96">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-green-200 to-blue-200 blur-2xl opacity-60 animate-pulse" />

      {/* Main globe */}
      <svg viewBox="0 0 200 200" className="w-full h-full relative z-10">
        <defs>
          {/* Globe gradient */}
          <radialGradient id="globeGrad" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>

          {/* Ocean pattern */}
          <pattern id="oceanPattern" patternUnits="userSpaceOnUse" width="10" height="10">
            <circle cx="5" cy="5" r="1" fill="#0ea5e9" opacity="0.3" />
          </pattern>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Ocean background */}
        <circle cx="100" cy="100" r="90" fill="#0ea5e9" stroke="#000" strokeWidth="4" />
        <circle cx="100" cy="100" r="90" fill="url(#oceanPattern)" />

        {/* Latitude/longitude lines */}
        <g stroke="#fff" strokeWidth="0.5" opacity="0.3" fill="none">
          <ellipse cx="100" cy="100" rx="90" ry="30" />
          <ellipse cx="100" cy="100" rx="90" ry="60" />
          <ellipse cx="100" cy="100" rx="30" ry="90" transform={`rotate(${rotation} 100 100)`} />
          <ellipse cx="100" cy="100" rx="60" ry="90" transform={`rotate(${rotation} 100 100)`} />
        </g>

        {/* Simplified continents */}
        <g fill="url(#globeGrad)" stroke="#000" strokeWidth="2">
          {/* North America */}
          <path d="M 35,55 Q 55,45 75,50 L 80,75 Q 55,90 35,80 Z" />
          {/* South America */}
          <path d="M 55,100 Q 70,95 75,105 L 70,135 Q 55,145 50,125 Z" />
          {/* Europe */}
          <path d="M 100,45 Q 125,40 140,50 L 135,70 Q 115,75 100,65 Z" />
          {/* Africa */}
          <path d="M 105,80 Q 130,75 145,90 L 140,130 Q 115,140 100,115 Z" />
          {/* Asia */}
          <path d="M 130,35 Q 165,30 180,50 L 175,85 Q 145,95 125,70 Z" />
          {/* Australia */}
          <path d="M 155,115 Q 175,110 185,120 L 180,140 Q 160,150 150,135 Z" />
        </g>

        {/* Animated flight paths */}
        <g filter="url(#glow)">
          {/* Path 1: Americas to Europe */}
          <path
            d="M 70,65 Q 85,35 120,55"
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeDashoffset={rotation}
          />
          <circle cx={70 + Math.sin(rotation * 0.02) * 25} cy={65 - Math.cos(rotation * 0.02) * 15} r="4" fill="#f97316" />

          {/* Path 2: Africa to Europe */}
          <path
            d="M 120,100 Q 115,75 125,60"
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeDashoffset={rotation * 0.8}
          />
          <circle cx={120 + Math.sin(rotation * 0.016) * 5} cy={100 - Math.cos(rotation * 0.016) * 20} r="4" fill="#8b5cf6" />

          {/* Path 3: Asia to Americas */}
          <path
            d="M 165,60 Q 120,30 65,60"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeDashoffset={rotation * 1.2}
          />
          <circle cx={165 - Math.sin(rotation * 0.024) * 50} cy={60 - Math.cos(rotation * 0.024) * 15 + Math.sin(rotation * 0.024) * 10} r="4" fill="#06b6d4" />
        </g>

        {/* Highlight markers */}
        <g>
          <circle cx="65" cy="65" r="5" fill="#ef4444" stroke="#000" strokeWidth="2" className="animate-ping" style={{ animationDuration: "2s" }} />
          <circle cx="65" cy="65" r="5" fill="#ef4444" stroke="#000" strokeWidth="2" />

          <circle cx="120" cy="55" r="5" fill="#3b82f6" stroke="#000" strokeWidth="2" className="animate-ping" style={{ animationDuration: "2.5s" }} />
          <circle cx="120" cy="55" r="5" fill="#3b82f6" stroke="#000" strokeWidth="2" />
        </g>

        {/* Globe border */}
        <circle cx="100" cy="100" r="90" fill="none" stroke="#000" strokeWidth="4" />

        {/* Shine effect */}
        <ellipse cx="70" cy="60" rx="30" ry="20" fill="white" opacity="0.15" />
      </svg>

      {/* Floating elements */}
      <div className="absolute top-4 right-4 animate-bounce" style={{ animationDuration: "3s" }}>
        <span className="text-3xl">✈️</span>
      </div>
      <div className="absolute bottom-8 left-4 animate-bounce" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }}>
        <span className="text-2xl">🌍</span>
      </div>
      <div className="absolute top-1/2 -right-2 animate-bounce" style={{ animationDuration: "2s", animationDelay: "1s" }}>
        <span className="text-2xl">🧳</span>
      </div>
    </div>
  );
}

// Floating flag badges
function FloatingFlags() {
  const flags = [
    { flag: "🇺🇸", label: "USA", top: "10%", left: "5%", delay: "0s" },
    { flag: "🇬🇧", label: "UK", top: "20%", right: "8%", delay: "0.3s" },
    { flag: "🇨🇦", label: "Canada", bottom: "30%", left: "3%", delay: "0.6s" },
    { flag: "🇩🇪", label: "Germany", bottom: "15%", right: "5%", delay: "0.9s" },
    { flag: "🇦🇺", label: "Australia", top: "40%", right: "2%", delay: "1.2s" },
  ];

  return (
    <>
      {flags.map((item, i) => (
        <div
          key={i}
          className="absolute hidden lg:flex items-center gap-2 bg-white border-2 border-black px-3 py-1.5 shadow-[3px_3px_0_0_#000] animate-float"
          style={{
            top: item.top,
            bottom: item.bottom,
            left: item.left,
            right: item.right,
            animationDelay: item.delay,
          }}
        >
          <span className="text-xl">{item.flag}</span>
          <span className="font-bold text-sm">{item.label}</span>
        </div>
      ))}
    </>
  );
}

interface HeroSectionProps {
  title: string;
  subtitle: string;
  tagline: string;
  ctaText: string;
  secondaryCtaText: string;
}

export function HeroSection({ title, subtitle, tagline, ctaText, secondaryCtaText }: HeroSectionProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-white to-cyan-50">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, #000 1px, transparent 0)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      {/* Floating flags */}
      <FloatingFlags />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left: Text content */}
          <div className="flex-1 text-center lg:text-left max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-yellow-300 border-2 border-black px-4 py-1.5 mb-6 shadow-[3px_3px_0_0_#000]">
              <Sparkles className="w-4 h-4" />
              <span className="font-bold text-sm">{tagline}</span>
            </div>

            {/* Title */}
            <h1 className="font-head text-5xl md:text-7xl lg:text-8xl mb-4 leading-tight">
              <span className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {title}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
              {subtitle}
            </p>

            {/* Stats bar */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">280M+</div>
                <div className="text-sm text-gray-600">Global Migrants</div>
              </div>
              <div className="w-px bg-gray-300 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">195</div>
                <div className="text-sm text-gray-600">Countries</div>
              </div>
              <div className="w-px bg-gray-300 hidden sm:block" />
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">1000s</div>
                <div className="text-sm text-gray-600">Corridors</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link href="/sign-up">
                <Button size="lg" className="text-lg px-8 py-4">
                  {ctaText}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                  {secondaryCtaText}
                </Button>
              </a>
            </div>
          </div>

          {/* Right: Globe animation */}
          <div className="flex-1 flex justify-center">
            <AnimatedGlobe />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-sm font-bold text-gray-500">Scroll to explore</span>
        <div className="w-6 h-10 border-2 border-black rounded-full flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-black rounded-full animate-pulse" />
        </div>
      </div>

      {/* Custom animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
