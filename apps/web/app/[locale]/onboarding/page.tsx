"use client";

import { useQuery } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  const profile = useQuery(api.users.getProfile);
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const isAddingNewJourney = searchParams.get("newJourney") === "true";

  useEffect(() => {
    // If user has already completed onboarding, redirect to dashboard
    // UNLESS they're adding a new journey
    if (profile?.onboardingComplete && !isAddingNewJourney) {
      router.push(`/${locale}/dashboard`);
    }
  }, [profile, router, locale, isAddingNewJourney]);

  // Loading state
  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="border-4 border-black bg-white p-8 shadow-brutal">
          <div className="animate-pulse text-center">Loading...</div>
        </div>
      </div>
    );
  }

  // If already onboarded and NOT adding new journey, show loading while redirecting
  if (profile?.onboardingComplete && !isAddingNewJourney) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="border-4 border-black bg-white p-8 shadow-brutal">
          <div className="text-center">Redirecting to dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <OnboardingWizard isAddingNewJourney={isAddingNewJourney} />
    </div>
  );
}
