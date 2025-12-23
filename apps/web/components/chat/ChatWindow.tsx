"use client";

import { useCopilotReadable } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-ui";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { Trash2, Send } from "lucide-react";
import "@copilotkit/react-ui/styles.css";

interface ChatWindowProps {
  corridorId?: Id<"corridors">;
}

export function ChatWindow({ corridorId }: ChatWindowProps) {
  const t = useTranslations("chat");
  const corridor = useQuery(
    api.corridors.getCorridor,
    corridorId ? { id: corridorId } : "skip"
  );
  const protocols = useQuery(
    api.protocols.getProtocols,
    corridorId ? { corridorId } : "skip"
  );
  const messages = useQuery(api.chat.getMessages, { corridorId, limit: 50 });
  const clearHistory = useMutation(api.chat.clearHistory);

  // Sync corridor state to CopilotKit for context-aware responses
  useCopilotReadable({
    description: "Current migration corridor information",
    value: corridor
      ? {
          origin: corridor.origin,
          destination: corridor.destination,
          stage: corridor.stage,
        }
      : null,
  });

  // Sync protocols to CopilotKit
  useCopilotReadable({
    description: "User's migration protocol checklist",
    value: protocols ?? [],
  });

  const handleClearHistory = useCallback(async () => {
    if (window.confirm(t("confirmClear"))) {
      await clearHistory({ corridorId });
    }
  }, [clearHistory, corridorId, t]);

  // Get dynamic welcome message
  const getWelcomeMessage = () => {
    if (corridor) {
      return t("welcomeWithCorridor", {
        origin: corridor.origin,
        destination: corridor.destination,
      });
    }
    return t("welcome");
  };

  return (
    <div className="h-full flex flex-col border-4 border-black shadow-[4px_4px_0_0_#000] bg-white">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b-4 border-black bg-yellow-100">
        <h2 className="text-xl font-bold">{t("title")}</h2>
        {messages && messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="p-2 border-2 border-black hover:bg-red-100 transition-colors"
            title={t("clearHistory")}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-hidden copilot-chat-container">
        <CopilotChat
          labels={{
            title: "",
            initial: getWelcomeMessage(),
            placeholder: t("placeholder"),
          }}
          icons={{
            sendIcon: <Send size={18} />,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
}
