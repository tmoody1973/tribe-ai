"use client";

import { UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading } from "convex/react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function DashboardPage() {
  const t = useTranslations();

  return (
    <main className="min-h-screen p-8">
      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </AuthLoading>
      <Authenticated>
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-8 pb-4 border-b-2 border-black">
            <h1 className="font-head text-3xl">{t("navigation.dashboard")}</h1>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10 border-2 border-black",
                  },
                }}
              />
            </div>
          </header>
          <div className="border-2 border-black shadow-brutal bg-white p-6">
            <h2 className="font-head text-xl mb-4">{t("dashboard.welcome")}</h2>
            <p className="text-muted-foreground">
              {t("dashboard.description")}
            </p>
          </div>
        </div>
      </Authenticated>
    </main>
  );
}
