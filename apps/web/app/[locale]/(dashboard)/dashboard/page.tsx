"use client";

import { Authenticated, AuthLoading } from "convex/react";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

function DashboardCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="block border-4 border-black shadow-brutal bg-white p-6 hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-head text-xl mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </Link>
  );
}

export default function DashboardPage() {
  const t = useTranslations();
  const { user } = useUser();

  return (
    <>
      <AuthLoading>
        <div className="flex items-center justify-center py-20">
          <div className="border-4 border-black shadow-brutal bg-white px-8 py-4">
            <p className="text-muted-foreground">{t("common.loading")}</p>
          </div>
        </div>
      </AuthLoading>
      <Authenticated>
        <div className="space-y-8">
          <div className="border-4 border-black shadow-brutal bg-white p-6">
            <h1 className="font-head text-2xl md:text-3xl mb-2">
              {t("dashboard.welcome")}
            </h1>
            <p className="text-muted-foreground">
              {user?.firstName ? `Hello, ${user.firstName}! ` : ""}
              {t("dashboard.description")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard
              title={t("navigation.chat")}
              description={t("dashboard.chatDescription")}
              href="/dashboard/chat"
              icon="💬"
            />
            <DashboardCard
              title={t("navigation.audio")}
              description={t("dashboard.audioDescription")}
              href="/dashboard/audio"
              icon="🎧"
            />
            <DashboardCard
              title={t("navigation.settings")}
              description={t("dashboard.settingsDescription")}
              href="/settings"
              icon="⚙️"
            />
          </div>

          <div className="border-4 border-black shadow-brutal bg-yellow-100 p-6">
            <h2 className="font-head text-xl mb-2">{t("dashboard.quickTip")}</h2>
            <p className="text-sm">
              {t("dashboard.quickTipText")}
            </p>
          </div>
        </div>
      </Authenticated>
    </>
  );
}
