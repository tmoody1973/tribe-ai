"use client";

import { useCopilotReadable, useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, MessageRole, Message } from "@copilotkit/runtime-client-gql";
import { CopilotChat } from "@copilotkit/react-ui";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { useCallback, useState, useEffect, useRef } from "react";
import { Trash2, Send, Volume2, VolumeX, Loader2, Phone } from "lucide-react";
import { VoiceInputButton } from "./VoiceInputButton";
import { TranscriptionPreview } from "./TranscriptionPreview";
import { SpeakingIndicator } from "./SpeakingIndicator";
import { VoiceChat } from "./VoiceChat";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { useVoiceResponse } from "@/hooks/useVoiceResponse";
import { useMigrationTools } from "@/hooks/useMigrationTools";
import { useADKToolRenderers } from "@/hooks/useADKToolRenderers";
import { useAgentProgress } from "@/hooks/useAgentProgress";
import { useHITLHandler } from "@/hooks/useHITLHandler";
import { useFrontendTools } from "@/hooks/useFrontendTools";
import "@copilotkit/react-ui/styles.css";

interface ChatWindowProps {
  corridorId?: Id<"corridors">;
}

export function ChatWindow({ corridorId }: ChatWindowProps) {
  const t = useTranslations("chat");
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [showVoiceChat, setShowVoiceChat] = useState(false);
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
  const culturalProfile = useQuery(api.cultural.profile.getProfile);

  // CopilotKit chat hook for programmatic message sending and messages
  const { appendMessage, visibleMessages } = useCopilotChat();

  // Voice response TTS hook
  const { speakingMessageId, isLoading: isTTSLoading, speak, stop } = useVoiceResponse();

  // Register migration tools with CopilotKit
  useMigrationTools();

  // Register ADK tool renderers for remote tool call UI
  useADKToolRenderers();

  // Register agent progress rendering for step-by-step updates
  useAgentProgress();

  // Register Human-in-the-Loop handlers for approval-required actions
  useHITLHandler();

  // Register frontend tools for UI control (navigation, modals, etc.)
  useFrontendTools();

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

  // Sync cultural profile to CopilotKit for culturally-aware responses
  useCopilotReadable({
    description: "User's cultural background profile from AI interview - use this to provide culturally-sensitive guidance and decode cultural situations",
    value: culturalProfile
      ? {
          originCulture: culturalProfile.originCulture,
          communicationStyle: culturalProfile.communicationStyle, // direct, indirect, context-dependent
          familyStructure: culturalProfile.familyStructure, // nuclear, extended, multi-generational
          timeOrientation: culturalProfile.timeOrientation, // monochronic (strict schedules) or polychronic (flexible)
          values: culturalProfile.values,
          foodDietary: culturalProfile.foodDietary,
          celebrations: culturalProfile.celebrations,
        }
      : null,
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

  // Handle suggested question selection
  const handleSelectQuestion = useCallback(
    async (question: string) => {
      await appendMessage(
        new TextMessage({
          role: MessageRole.User,
          content: question,
        })
      );
    },
    [appendMessage]
  );

  // Get current protocol (first in-progress or not-started)
  const currentProtocol = protocols?.find(
    (p: any) => p.status === "in_progress" || p.status === "not_started"
  );

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
    <div
      className="h-full flex flex-col border-4 border-black shadow-[4px_4px_0_0_#000] bg-white"
      data-testid="chat-window"
    >
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b-4 border-black bg-yellow-100">
        <h2 className="text-xl font-bold" data-testid="chat-title">{t("title")}</h2>
        <div className="flex items-center gap-2">
          {/* Voice Chat Button */}
          <button
            onClick={() => setShowVoiceChat(true)}
            className="p-2 border-2 border-black hover:bg-green-100 transition-colors bg-white"
            title={t("voice.startVoiceChat") || "Voice Chat"}
          >
            <Phone size={18} />
          </button>
          {/* Clear History Button */}
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
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-hidden copilot-chat-container" data-testid="chat-body">
        <CopilotChat
          instructions={`You are TRIBE, the ultimate Migration Intelligence Advisor. You're like a wise friend who has helped thousands of people relocate internationally. You combine AI precision with deep cultural empathy.

🛠️ YOUR POWERFUL TOOLKIT - USE THESE TOOLS PROACTIVELY:

PRACTICAL RELOCATION:
• Housing/apartments/accommodation → searchTemporaryHousing
• Cost of living/expenses/budgeting → compareCostOfLiving
• Documents/paperwork/what to prepare → getDocumentChecklist
• Bank accounts/money/transfers → getBankingGuide
• Jobs/employment/career → getJobSearchResources
• Language learning/communication → getLanguageResources

VISA & LEGAL:
• Visas/work permits/legal requirements → checkVisaResources
• Healthcare/insurance/medical → getHealthcareInfo

COMMUNITY & CULTURE:
• Expat communities/making friends → findExpatCommunities
• Cultural misunderstandings → decodeCulturalSituation
• Cultural tips (workplace/social/dining) → getCulturalTips

🧠 CULTURAL INTELLIGENCE:
You have the user's cultural profile. Use it to:
• Decode situations from BOTH cultural perspectives
• Adjust your communication style (direct vs indirect)
• Explain WHY things are different, not just WHAT
• Consider their time orientation (monochronic vs polychronic)
• Account for family dynamics in housing/integration advice

📋 CULTURAL DECODING FORMAT:
When someone says "I don't understand why..." or describes confusion:
1. Validate their experience - confusion is normal
2. Explain the local perspective with context
3. Compare to their origin culture
4. Give practical navigation tips
5. Suggest recovery phrases if relevant

⚡ PROACTIVE ASSISTANCE:
• Anticipate what they'll need next (housing leads to banking leads to jobs)
• Offer follow-up actions ("Would you like me to also check...")
• Connect topics ("Since you're looking at jobs, let me also show you document requirements")

📍 CONTEXT YOU HAVE:
• Migration corridor (origin → destination)
• Saved protocols and tasks
• Cultural profile from interview
• User's preferred language

❌ NEVER:
• Say "search online" when you have a tool
• Make up visa timelines or costs
• Give legal advice
• Dismiss cultural differences as wrong

✅ ALWAYS:
• Use tools immediately when relevant
• Be concise but actionable
• Add helpful context around results
• Use empathetic framing for cultural topics
• Proactively suggest next steps`}
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

      {/* Suggested Questions */}
      {corridor && visibleMessages && visibleMessages.length < 3 && (
        <SuggestedQuestions
          origin={corridor.origin}
          destination={corridor.destination}
          stage={corridor.stage}
          currentProtocol={currentProtocol as any}
          onSelectQuestion={handleSelectQuestion}
        />
      )}

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

      {/* Voice Chat Modal */}
      {showVoiceChat && (
        <VoiceChat
          language={userLanguage}
          onClose={() => setShowVoiceChat(false)}
        />
      )}
    </div>
  );
}
