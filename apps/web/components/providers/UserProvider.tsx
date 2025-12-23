"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * Ensures the user exists in Convex when they sign in
 * This is a fallback in case the Clerk webhook didn't fire
 */
export function UserProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser();
  const ensureUser = useMutation(api.users.ensureUser);
  const hasEnsured = useRef(false);

  useEffect(() => {
    if (isLoaded && isSignedIn && !hasEnsured.current) {
      hasEnsured.current = true;
      ensureUser().catch((error) => {
        console.error("Failed to ensure user:", error);
      });
    }
  }, [isLoaded, isSignedIn, ensureUser]);

  return <>{children}</>;
}
