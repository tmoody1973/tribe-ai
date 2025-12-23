export const navLinks = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/chat", labelKey: "chat" },
  { href: "/settings", labelKey: "settings" },
] as const;

export type NavLink = (typeof navLinks)[number];
