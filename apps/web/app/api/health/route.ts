import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    status: "healthy" as "healthy" | "unhealthy",
    timestamp: new Date().toISOString(),
    services: {} as Record<string, { status: string }>,
  };

  // Basic health - Convex check comes in Story 1.2 after auth
  checks.services.nextjs = { status: "up" };

  return NextResponse.json(checks, { status: 200 });
}
