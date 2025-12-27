"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, Radio, MessageSquare, Settings } from "lucide-react";

const bottomNavItems = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/feed", labelKey: "feed", icon: Radio },
  { href: "/chat", labelKey: "chat", icon: MessageSquare },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(href + "/");
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-black bg-white md:hidden">
        <div className="grid grid-cols-4 gap-0">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 min-h-[64px] transition-all
                  ${active
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 active:bg-gray-100"
                  }`}
              >
                <Icon
                  size={24}
                  strokeWidth={2.5}
                  className="mb-1"
                />
                <span className={`text-xs font-bold leading-tight text-center
                  ${active ? "text-white" : "text-gray-700"}`}
                >
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
