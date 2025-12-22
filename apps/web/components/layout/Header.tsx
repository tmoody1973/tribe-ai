"use client";

import Link from "next/link";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { DesktopNav } from "./DesktopNav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b-4 border-black bg-white">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-head text-2xl tracking-tight">
          TRIBE
        </Link>

        <DesktopNav className="hidden md:flex" />

        <div className="flex items-center gap-3 relative">
          <LanguageSwitcher />
          <UserMenu />
          <MobileNav className="md:hidden" />
        </div>
      </div>
    </header>
  );
}
