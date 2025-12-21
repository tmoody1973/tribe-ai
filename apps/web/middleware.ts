import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { locales, defaultLocale } from "./i18n/config";

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

const isProtectedRoute = createRouteMatcher([
  "/:locale/dashboard(.*)",
  "/:locale/corridor(.*)",
  "/:locale/settings(.*)",
  "/:locale/voice(.*)",
]);

const isApiRoute = createRouteMatcher([
  "/api(.*)",
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  // Skip intl middleware for API routes
  if (isApiRoute(req)) {
    return;
  }

  // Protect authenticated routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }

  // Apply intl middleware for all non-API routes
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
