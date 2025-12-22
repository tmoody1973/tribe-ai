"use client";

import { Button } from "@/components/retroui/Button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

interface CTASectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  subCtaText: string;
}

export function CTASection({ title, subtitle, ctaText, subCtaText }: CTASectionProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Floating elements */}
      <div className="absolute top-10 left-10 text-6xl animate-bounce" style={{ animationDuration: "3s" }}>🌍</div>
      <div className="absolute bottom-10 right-10 text-6xl animate-bounce" style={{ animationDuration: "2.5s" }}>✈️</div>
      <div className="absolute top-1/2 right-20 text-5xl animate-bounce hidden lg:block" style={{ animationDuration: "3.5s" }}>🧳</div>
      <div className="absolute top-20 right-1/3 text-4xl animate-bounce hidden lg:block" style={{ animationDuration: "2.8s" }}>🗺️</div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border-2 border-white/40 px-4 py-2 mb-8 rounded-full">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="font-bold text-white">{subCtaText}</span>
          </div>

          {/* Title */}
          <h2 className="font-head text-4xl md:text-6xl text-white mb-6 leading-tight">
            {title}
          </h2>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto">
            {subtitle}
          </p>

          {/* CTA Button */}
          <Link href="/sign-up">
            <Button
              size="lg"
              className="
                text-xl px-12 py-6
                bg-white text-green-700
                hover:bg-yellow-300 hover:text-black
                border-4 border-black
                shadow-[6px_6px_0_0_#000]
                hover:shadow-[3px_3px_0_0_#000]
              "
            >
              {ctaText}
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </Link>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 mt-12 text-white/80">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔒</span>
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚡</span>
              <span>Ready in 30 seconds</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              <span>Works worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
