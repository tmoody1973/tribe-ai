"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// Only create Convex client if URL is configured
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: ReactNode }) {
  // If Convex is not configured, render children without provider
  if (!convex) {
    return <>{children}</>;
  }
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
