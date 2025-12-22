"use client";

import { useRequireOnboarding } from "@/hooks/useRequireOnboarding";

export function DashboardGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, needsOnboarding } = useRequireOnboarding();

  // Show loading while checking onboarding status
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="border-4 border-black bg-white p-8 shadow-brutal">
          <div className="animate-pulse text-center">Loading...</div>
        </div>
      </div>
    );
  }

  // Show loading while redirecting to onboarding
  if (needsOnboarding) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="border-4 border-black bg-white p-8 shadow-brutal">
          <div className="text-center">Redirecting to onboarding...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
