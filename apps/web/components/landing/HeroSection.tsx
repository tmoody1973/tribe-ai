"use client";

import { Button } from "@/components/retroui/Button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import the Mapbox map to avoid SSR issues
const HeroGlobeMap = dynamic(
  () => import("./HeroGlobeMap").then((mod) => mod.HeroGlobeMap),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] lg:w-[480px] lg:h-[480px]">
        {/* Loading placeholder with glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-200 via-blue-200 to-indigo-200 blur-2xl opacity-60 animate-pulse" />
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-black shadow-[8px_8px_0_0_#000] bg-gradient-to-br from-cyan-100 via-blue-200 to-indigo-200 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-10 h-10 border-4 border-gray-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-600">Loading Map...</p>
          </div>
        </div>
      </div>
    ),
  }
);


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

          {/* Right: Interactive globe map */}
          <div className="flex-1 flex justify-center">
            <HeroGlobeMap />
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
    </section>
  );
}
