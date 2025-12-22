"use client";

import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default function OnboardingPage() {
  const profile = useQuery(api.users.getProfile);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    // If user has already completed onboarding, redirect to dashboard
    if (profile?.onboardingComplete) {
      router.push(`/${locale}/dashboard`);
    }
  }, [profile, router, locale]);

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

  // If already onboarded, show loading while redirecting
  if (profile?.onboardingComplete) {
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
      <OnboardingWizard />
    </div>
  );
}
