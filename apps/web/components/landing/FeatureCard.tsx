"use client";

import { ReactNode } from "react";

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  children?: ReactNode;
}

const colorClasses: Record<string, string> = {
  purple: "bg-purple-100 border-l-purple-500",
  green: "bg-green-100 border-l-green-500",
  blue: "bg-blue-100 border-l-blue-500",
  orange: "bg-orange-100 border-l-orange-500",
  pink: "bg-pink-100 border-l-pink-500",
  yellow: "bg-yellow-100 border-l-yellow-500",
};

export function FeatureCard({ icon, title, description, color, children }: FeatureCardProps) {
  return (
    <div
      className={`
        border-4 border-black border-l-8 p-6
        shadow-[4px_4px_0_0_#000]
        hover:shadow-[2px_2px_0_0_#000]
        hover:translate-x-[2px] hover:translate-y-[2px]
        transition-all duration-200
        ${colorClasses[color] || "bg-white"}
      `}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-xl mb-2">{title}</h3>
      <p className="text-gray-700">{description}</p>
      {children}
    </div>
  );
}
