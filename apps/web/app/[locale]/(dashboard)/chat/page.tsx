"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";

export default function ChatPage() {
  const t = useTranslations("chat");
  const corridor = useQuery(api.corridors.getActiveCorridor) as Doc<"corridors"> | undefined | null;

  if (corridor === undefined) {
    // Loading state
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="border-4 border-black bg-white p-8 shadow-[4px_4px_0_0_#000] animate-pulse">
          <p className="text-lg font-bold">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!corridor) {
    // No corridor selected
    return (
      <div className="h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="border-4 border-black bg-yellow-50 p-8 shadow-[4px_4px_0_0_#000] text-center max-w-md">
          <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">{t("noCorridorTitle")}</h2>
          <p className="text-gray-600">{t("noCorridorDescription")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)]">
      <ChatWindow corridorId={corridor._id} />
    </div>
  );
}
