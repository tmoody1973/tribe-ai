export const locales = ["en", "yo", "hi", "pt", "tl", "ko", "de", "fr", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  yo: "Yorùbá",
  hi: "हिन्दी",
  pt: "Português",
  tl: "Tagalog",
  ko: "한국어",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  yo: "🇳🇬",
  hi: "🇮🇳",
  pt: "🇧🇷",
  tl: "🇵🇭",
  ko: "🇰🇷",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
};
