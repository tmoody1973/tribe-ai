"use client";

import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export function UserMenu() {
  const t = useTranslations("auth");

  return (
    <>
      <SignedIn>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-10 h-10 border-2 border-black",
              userButtonPopoverCard: "border-2 border-black shadow-brutal",
              userButtonPopoverActionButton: "hover:bg-gray-100",
            },
          }}
        />
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <button className="border-2 border-black px-4 py-2 font-bold bg-white hover:bg-gray-100 shadow-brutal hover:shadow-none hover:translate-y-0.5 transition-all">
            {t("signIn")}
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
