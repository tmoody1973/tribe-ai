"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ReactNode } from "react";

interface CopilotProviderProps {
  children: ReactNode;
}

export function CopilotProvider({ children }: CopilotProviderProps) {
  const profile = useQuery(api.users.getProfile);
  const activeCorridor = useQuery(api.corridors.getActiveCorridor);

  return (
    <CopilotKit
      runtimeUrl="/api/copilotkit"
      showDevConsole={true}
      onError={(error) => {
        console.error("CopilotKit Error:", error);
      }}
      properties={{
        userId: profile?._id,
        corridor: activeCorridor
          ? {
              origin: activeCorridor.origin,
              destination: activeCorridor.destination,
              id: activeCorridor._id,
            }
          : null,
        stage: activeCorridor?.stage,
        language: profile?.language ?? "en",
      }}
    >
      {children}
    </CopilotKit>
  );
}
