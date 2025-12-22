"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navLinks } from "@/lib/navigation";

interface DesktopNavProps {
  className?: string;
}

export function DesktopNav({ className }: DesktopNavProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(href + "/");
  };

  return (
    <nav className={className}>
      <ul className="flex gap-1">
        {navLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`block border-2 border-black px-4 py-2 font-bold transition-all
                ${isActive(link.href)
                  ? "bg-black text-white"
                  : "bg-white hover:bg-gray-100 shadow-brutal hover:shadow-none hover:translate-y-0.5"
                }`}
            >
              {t(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
