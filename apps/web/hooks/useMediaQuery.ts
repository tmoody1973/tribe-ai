"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect media query matches for responsive behavior
 * @param query - CSS media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/**
 * Common breakpoint hooks
 */
export function useIsDesktop(): boolean {
  return useMediaQuery("(min-width: 768px)");
}

export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 767px)");
}
