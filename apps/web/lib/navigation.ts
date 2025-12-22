export const navLinks = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/dashboard/chat", labelKey: "chat" },
  { href: "/dashboard/audio", labelKey: "audio" },
  { href: "/settings", labelKey: "settings" },
] as const;

export type NavLink = (typeof navLinks)[number];
