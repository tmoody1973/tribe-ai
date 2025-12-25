"use client";

import { useCopilotReadable, useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, MessageRole, Message } from "@copilotkit/runtime-client-gql";
import { CopilotChat } from "@copilotkit/react-ui";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { useCallback, useState, useEffect, useRef } from "react";
import { Trash2, Send, Volume2, VolumeX, Loader2 } from "lucide-react";
import { VoiceInputButton } from "./VoiceInputButton";
import { TranscriptionPreview } from "./TranscriptionPreview";
import { SpeakingIndicator } from "./SpeakingIndicator";
import { useVoiceResponse } from "@/hooks/useVoiceResponse";
import "@copilotkit/react-ui/styles.css";

interface ChatWindowProps {
  corridorId?: Id<"corridors">;
}

export function ChatWindow({ corridorId }: ChatWindowProps) {
  const t = useTranslations("chat");
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const lastSpokenMessageRef = useRef<string | null>(null);

  const corridor = useQuery(
    api.corridors.getCorridor,
    corridorId ? { id: corridorId } : "skip"
  );
  const protocols = useQuery(
    api.protocols.getProtocols,
    corridorId ? { corridorId } : "skip"
  );
  const convexMessages = useQuery(api.chat.getMessages, { corridorId, limit: 50 });
  const clearHistory = useMutation(api.chat.clearHistory);
  const profile = useQuery(api.users.getProfile);

  // CopilotKit chat hook for programmatic message sending and messages
  const { appendMessage, visibleMessages } = useCopilotChat();

  // Voice response TTS hook
  const { speakingMessageId, isLoading: isTTSLoading, speak, stop } = useVoiceResponse();

  // Get user's language for STT/TTS
  const userLanguage = profile?.language ?? "en";
  const autoSpeak = profile?.autoSpeak ?? false;

  // Helper to get content from a message
  const getMessageContent = (message: Message): string => {
    if (message.isTextMessage()) {
      return message.content || "";
    }
    return "";
  };

  // Helper to check if message is from assistant
  const isAssistantMessage = (message: Message): boolean => {
    if (message.isTextMessage()) {
      return message.role === MessageRole.Assistant;
    }
    return false;
  };

  // Get the last assistant message from CopilotKit
  const lastAssistantMessage = visibleMessages
    ?.filter((m) => isAssistantMessage(m))
    .slice(-1)[0];

  // Auto-speak new assistant messages if enabled
  useEffect(() => {
    if (!autoSpeak || !lastAssistantMessage) return;

    // Only speak if this is a new message we haven't spoken yet
    const messageContent = getMessageContent(lastAssistantMessage);

    if (
      messageContent &&
      lastSpokenMessageRef.current !== lastAssistantMessage.id &&
      !speakingMessageId
    ) {
      lastSpokenMessageRef.current = lastAssistantMessage.id;
      speak(lastAssistantMessage.id, messageContent, userLanguage);
    }
  }, [lastAssistantMessage, autoSpeak, speakingMessageId, speak, userLanguage]);

  // Stop TTS on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && speakingMessageId) {
        stop();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [speakingMessageId, stop]);

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

  // Sync protocols to CopilotKit (read-only context)
  useCopilotReadable({
    description: "Migration protocols and steps the user has saved (read-only reference)",
    value: protocols ?? [],
  });

  const handleClearHistory = useCallback(async () => {
    if (window.confirm(t("confirmClear"))) {
      await clearHistory({ corridorId });
    }
  }, [clearHistory, corridorId, t]);

  // Handle voice transcription result
  const handleTranscription = useCallback((text: string) => {
    setTranscription(text);
    setIsVoiceMode(true);
  }, []);

  // Send transcribed message via CopilotKit
  const handleVoiceSend = useCallback(
    async (text: string) => {
      if (text.trim()) {
        await appendMessage(
          new TextMessage({
            role: MessageRole.User,
            content: text.trim(),
          })
        );
      }
      setTranscription(null);
      setIsVoiceMode(false);
    },
    [appendMessage]
  );

  // Cancel voice input
  const handleVoiceCancel = useCallback(() => {
    setTranscription(null);
    setIsVoiceMode(false);
  }, []);

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
        {convexMessages && convexMessages.length > 0 && (
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
          instructions={`You are TRIBE's Migration Intelligence Advisor, helping users navigate international relocation.

IMPORTANT RULES:
1. Always respond in the user's preferred language when specified
2. Be concise but actionable - users need practical guidance
3. Admit when information is not available rather than guessing
4. Never invent facts
5. Flag potentially outdated information with warnings
6. Prioritize practical, actionable advice

CONTEXT:
You have access to read-only information about the user's migration corridor (origin/destination) and any saved protocol steps. Use this context to provide personalized guidance.

DO NOT:
- Attempt to modify any state or checklist data
- Make up visa processing times or costs
- Provide legal advice

RESPONSE FORMAT:
- Start with a direct answer to the question
- Provide supporting details
- End with actionable next steps if applicable`}
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

      {/* Voice Input Section */}
      {isVoiceMode && transcription ? (
        <div className="p-4 border-t-4 border-black">
          <TranscriptionPreview
            text={transcription}
            onSend={handleVoiceSend}
            onCancel={handleVoiceCancel}
            onReRecord={handleVoiceCancel}
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 border-t-4 border-black bg-gray-50">
          {/* Voice Input */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {t("voice.holdToSpeak")}
            </span>
            <VoiceInputButton
              onTranscription={handleTranscription}
              language={userLanguage}
            />
          </div>

          {/* Listen to Last Response */}
          {lastAssistantMessage && (
            <div className="flex items-center gap-2">
              {speakingMessageId && <SpeakingIndicator />}
              <button
                onClick={() => {
                  if (speakingMessageId) {
                    stop();
                  } else {
                    const content = getMessageContent(lastAssistantMessage);
                    if (content) {
                      speak(lastAssistantMessage.id, content, userLanguage);
                    }
                  }
                }}
                disabled={isTTSLoading}
                className={`
                  flex items-center gap-2 px-3 py-2 border-4 border-black font-bold transition-colors
                  ${speakingMessageId ? "bg-red-100 text-red-700" : "bg-white hover:bg-gray-100"}
                  ${isTTSLoading ? "opacity-50 cursor-not-allowed" : ""}
                `}
                title={speakingMessageId ? t("voice.stopListening") : t("voice.listenToResponse")}
              >
                {isTTSLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : speakingMessageId ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
                <span className="text-sm">
                  {speakingMessageId ? t("voice.stop") : t("voice.listen")}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
