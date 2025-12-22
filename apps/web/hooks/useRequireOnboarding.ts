"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

export function useRequireOnboarding() {
  const profile = useQuery(api.users.getProfile);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (profile === undefined) return; // Loading
    if (profile === null) return; // Not authenticated (handled elsewhere)
    if (!profile.onboardingComplete) {
      router.push(`/${locale}/onboarding`);
    }
  }, [profile, router, locale]);

  return {
    profile,
    isLoading: profile === undefined,
    needsOnboarding: profile !== undefined && profile !== null && !profile.onboardingComplete,
  };
}
