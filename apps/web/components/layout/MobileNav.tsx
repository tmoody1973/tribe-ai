"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { navLinks } from "@/lib/navigation";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "");
    return pathWithoutLocale === href || pathWithoutLocale.startsWith(href + "/");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={className} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="border-2 border-black p-2 bg-white"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <span className={`block w-6 h-0.5 bg-black transition-all ${isOpen ? "rotate-45 translate-y-2" : "mb-1.5"}`} />
        <span className={`block w-6 h-0.5 bg-black transition-all ${isOpen ? "opacity-0" : "mb-1.5"}`} />
        <span className={`block w-6 h-0.5 bg-black transition-all ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 border-2 border-black bg-white shadow-brutal">
          <nav className="p-2">
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={`block border-2 border-black px-4 py-3 font-bold transition-all
                      ${isActive(link.href)
                        ? "bg-black text-white"
                        : "bg-white hover:bg-gray-100"
                      }`}
                  >
                    {t(link.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
