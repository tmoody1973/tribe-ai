"use client";

import { useState, useEffect, useRef } from "react";
import { useAction } from "convex/react";
import { useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

type Category = "visa" | "finance" | "housing" | "employment" | "legal" | "health" | "social";
type Priority = "critical" | "high" | "medium" | "low";
type Status = "not_started" | "in_progress" | "completed" | "blocked";

interface AttributionData {
  authorName?: string;
  sourceUrl: string;
  sourceDate?: number;
  engagement?: number;
}

interface Protocol {
  _id: Id<"protocols">;
  category: Category;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  warnings?: string[];
  hacks?: string[];
  attribution?: AttributionData;
  order: number;
}

interface UseTranslatedProtocolReturn {
  protocol: Protocol;
  isTranslating: boolean;
  isTranslated: boolean;
}

/**
 * Hook to translate protocol content to user's locale
 * Skips translation if locale is English (source language)
 */
export function useTranslatedProtocol(protocol: Protocol): UseTranslatedProtocolReturn {
  const locale = useLocale();
  const batchTranslate = useAction(api.ai.translation.batchTranslate);

  const [translated, setTranslated] = useState<Protocol>(protocol);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslated, setIsTranslated] = useState(false);

  // Track which protocol we're translating to avoid stale updates
  const translatingIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset when protocol changes
    setTranslated(protocol);
    setIsTranslated(false);

    // Skip translation if English
    if (locale === "en") {
      return;
    }

    // Skip if no content to translate
    if (!protocol.title && !protocol.description) {
      return;
    }

    async function translate() {
      translatingIdRef.current = protocol._id;
      setIsTranslating(true);

      try {
        // Collect all texts to translate
        const textsToTranslate: string[] = [protocol.title, protocol.description];

        // Add warnings if present
        const warningsStartIndex = textsToTranslate.length;
        if (protocol.warnings && protocol.warnings.length > 0) {
          textsToTranslate.push(...protocol.warnings);
        }

        // Add hacks if present
        const hacksStartIndex = textsToTranslate.length;
        if (protocol.hacks && protocol.hacks.length > 0) {
          textsToTranslate.push(...protocol.hacks);
        }

        // Batch translate all content
        const results = await batchTranslate({
          texts: textsToTranslate,
          targetLocale: locale,
          sourceLocale: "en",
        });

        // Check if this is still the protocol we're translating
        if (translatingIdRef.current !== protocol._id) {
          return;
        }

        // Extract translated content
        const translatedTitle = results[0]?.text ?? protocol.title;
        const translatedDescription = results[1]?.text ?? protocol.description;

        let translatedWarnings: string[] | undefined;
        if (protocol.warnings && protocol.warnings.length > 0) {
          translatedWarnings = results
            .slice(warningsStartIndex, warningsStartIndex + protocol.warnings.length)
            .map((r: { text: string; cached: boolean; translated: boolean }, i: number) => r?.text ?? protocol.warnings![i]);
        }

        let translatedHacks: string[] | undefined;
        if (protocol.hacks && protocol.hacks.length > 0) {
          translatedHacks = results
            .slice(hacksStartIndex, hacksStartIndex + protocol.hacks.length)
            .map((r: { text: string; cached: boolean; translated: boolean }, i: number) => r?.text ?? protocol.hacks![i]);
        }

        setTranslated({
          ...protocol,
          title: translatedTitle,
          description: translatedDescription,
          warnings: translatedWarnings,
          hacks: translatedHacks,
        });
        setIsTranslated(true);
      } catch (error) {
        console.error("Translation failed:", error);
        // Keep original content on error
        setTranslated(protocol);
      } finally {
        if (translatingIdRef.current === protocol._id) {
          setIsTranslating(false);
        }
      }
    }

    translate();
  }, [protocol._id, protocol.title, protocol.description, locale, batchTranslate, protocol.warnings, protocol.hacks]);

  return {
    protocol: translated,
    isTranslating,
    isTranslated,
  };
}
