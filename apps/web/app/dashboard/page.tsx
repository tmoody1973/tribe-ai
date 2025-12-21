"use client";

import { UserButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading } from "convex/react";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8">
      <AuthLoading>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AuthLoading>
      <Authenticated>
        <div className="max-w-4xl mx-auto">
          <header className="flex items-center justify-between mb-8 pb-4 border-b-2 border-black">
            <h1 className="font-head text-3xl">Dashboard</h1>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10 border-2 border-black",
                },
              }}
            />
          </header>
          <div className="border-2 border-black shadow-brutal bg-white p-6">
            <h2 className="font-head text-xl mb-4">Welcome to TRIBE</h2>
            <p className="text-muted-foreground">
              Your diaspora intelligence dashboard is ready.
            </p>
          </div>
        </div>
      </Authenticated>
    </main>
  );
}
