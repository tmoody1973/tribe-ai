"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { CountrySelector } from "./CountrySelector";
import { StageSelector } from "./StageSelector";
import { ProgressIndicator } from "./ProgressIndicator";
import { Send, Loader2 } from "lucide-react";
import type { MigrationStage } from "@/lib/constants/stages";

type Step = "origin" | "destination" | "stage" | "visa" | "culture";

const fullSteps: Step[] = ["origin", "destination", "stage", "visa", "culture"];
const newJourneySteps: Step[] = ["origin", "destination", "stage", "visa"]; // Skip culture for new journeys

interface InterviewState {
  questionNumber: number;
  responses: Record<string, string>;
  currentQuestion: string;
  isComplete: boolean;
}

interface Message {
  role: "ai" | "user";
  content: string;
}

interface OnboardingWizardProps {
  isAddingNewJourney?: boolean;
}

export function OnboardingWizard({ isAddingNewJourney = false }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    originCountry: "",
    destinationCountry: "",
    stage: "" as MigrationStage | "",
    visaType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cultural interview state
  const [showInterview, setShowInterview] = useState(false);
  const [interviewState, setInterviewState] = useState<InterviewState | null>(null);
  const [answer, setAnswer] = useState("");
  const [isLoadingInterview, setIsLoadingInterview] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const createJourney = useMutation(api.corridors.createJourney);
  const startInterview = useAction(api.cultural.interview.startInterview);
  const continueInterview = useAction(api.cultural.interview.continueInterview);
  const culturalProfile = useQuery(api.cultural.profile.getProfile);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("onboarding");
  const tCultural = useTranslations("cultural");

  // Use different steps based on whether adding new journey
  const steps = isAddingNewJourney ? newJourneySteps : fullSteps;
  const step = steps[currentStep];

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canProceed = () => {
    switch (step) {
      case "origin":
        return formData.originCountry !== "";
      case "destination":
        return formData.destinationCountry !== "";
      case "stage":
        return formData.stage !== "";
      case "visa":
        return true; // Optional step
      case "culture":
        return true; // Can skip or complete
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      // If in interview, go back to culture choice
      if (showInterview) {
        setShowInterview(false);
        setInterviewState(null);
        setMessages([]);
        return;
      }
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!formData.stage) return;

    setIsSubmitting(true);
    try {
      if (isAddingNewJourney) {
        // Create a new journey for existing user
        await createJourney({
          origin: formData.originCountry,
          destination: formData.destinationCountry,
          stage: formData.stage,
          name: `${formData.originCountry} to ${formData.destinationCountry}`,
        });
      } else {
        // First time onboarding
        await completeOnboarding({
          originCountry: formData.originCountry,
          destinationCountry: formData.destinationCountry,
          stage: formData.stage,
          visaType: formData.visaType || undefined,
        });
      }
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setIsSubmitting(false);
    }
  };

  // Cultural interview handlers
  const handleStartInterview = async () => {
    setShowInterview(true);
    setIsLoadingInterview(true);
    try {
      const result = await startInterview({});
      setInterviewState(result);
      setMessages([{ role: "ai", content: result.currentQuestion }]);
    } catch (error) {
      console.error("Failed to start interview:", error);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!interviewState || !answer.trim() || isLoadingInterview) return;

    const userAnswer = answer.trim();
    setAnswer("");
    setMessages((prev) => [...prev, { role: "user", content: userAnswer }]);
    setIsLoadingInterview(true);

    try {
      const result = await continueInterview({
        previousAnswer: userAnswer,
        questionNumber: interviewState.questionNumber,
        responses: interviewState.responses,
      });

      setInterviewState(result);
      setMessages((prev) => [...prev, { role: "ai", content: result.currentQuestion }]);

      // If complete, auto-proceed after a moment
      if (result.isComplete) {
        setTimeout(() => {
          handleComplete();
        }, 2000);
      }
    } catch (error) {
      console.error("Failed to continue interview:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: tCultural("interviewError") },
      ]);
    } finally {
      setIsLoadingInterview(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "origin":
        return (
          <div className="space-y-4">
            <h2 className="font-bold text-xl">{t("steps.origin")}</h2>
            <CountrySelector
              value={formData.originCountry}
              onChange={(code) => setFormData({ ...formData, originCountry: code })}
              placeholder={t("placeholders.selectCountry")}
            />
          </div>
        );
      case "destination":
        return (
          <div className="space-y-4">
            <h2 className="font-bold text-xl">{t("steps.destination")}</h2>
            <CountrySelector
              value={formData.destinationCountry}
              onChange={(code) => setFormData({ ...formData, destinationCountry: code })}
              placeholder={t("placeholders.selectCountry")}
            />
          </div>
        );
      case "stage":
        return (
          <div className="space-y-4">
            <h2 className="font-bold text-xl">{t("steps.stage")}</h2>
            <StageSelector
              value={formData.stage}
              onChange={(stage) => setFormData({ ...formData, stage })}
            />
          </div>
        );
      case "visa":
        return (
          <div className="space-y-4">
            <h2 className="font-bold text-xl">{t("steps.visa")}</h2>
            <input
              type="text"
              value={formData.visaType}
              onChange={(e) => setFormData({ ...formData, visaType: e.target.value })}
              placeholder={t("placeholders.visaType")}
              className="w-full border-4 border-black px-4 py-3 font-bold shadow-brutal outline-none focus:shadow-none focus:translate-y-0.5 transition-all"
            />
            <p className="text-sm text-gray-600">{t("visaHint")}</p>
          </div>
        );
      case "culture":
        // If already has profile, show success
        if (culturalProfile) {
          return (
            <div className="text-center space-y-4">
              <div className="text-6xl">✅</div>
              <h2 className="font-bold text-xl">{tCultural("profileComplete")}</h2>
              <p className="text-gray-600">{tCultural("profileCompleteDesc")}</p>
            </div>
          );
        }

        // If showing interview
        if (showInterview) {
          return (
            <div className="space-y-4">
              {/* Progress */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{tCultural("culturalInterview")}</span>
                <span className="text-sm bg-amber-100 px-2 py-1 border border-black">
                  {interviewState?.isComplete
                    ? tCultural("complete")
                    : `${tCultural("question")} ${interviewState?.questionNumber || 1} / 10`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-gray-200 border border-black">
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{
                    width: `${interviewState?.isComplete ? 100 : ((interviewState?.questionNumber || 1) / 10) * 100}%`,
                  }}
                />
              </div>

              {/* Messages */}
              <div className="h-48 overflow-y-auto border-2 border-black bg-gray-50 p-3 space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 border-2 border-black ${
                        msg.role === "user" ? "bg-cyan-100" : "bg-amber-100"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {isLoadingInterview && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 p-3 border-2 border-black">
                      <Loader2 className="animate-spin" size={18} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {!interviewState?.isComplete && (
                <div className="flex gap-2">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={tCultural("typeYourAnswer")}
                    rows={2}
                    className="flex-1 border-2 border-black p-2 text-sm resize-none"
                    disabled={isLoadingInterview}
                  />
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isLoadingInterview || !answer.trim()}
                    className="bg-green-500 border-2 border-black p-2 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              )}

              {interviewState?.isComplete && (
                <div className="text-center p-3 bg-green-50 border-2 border-green-300">
                  <p className="text-green-700 font-medium">
                    {tCultural("profileCreated")} - Redirecting to dashboard...
                  </p>
                </div>
              )}
            </div>
          );
        }

        // Initial culture step - choice to start or skip
        return (
          <div className="text-center space-y-6">
            <div className="text-6xl">🌍</div>
            <h2 className="font-bold text-xl">{t("steps.culture")}</h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              {t("cultureDescription")}
            </p>

            <div className="space-y-3">
              <button
                onClick={handleStartInterview}
                disabled={isLoadingInterview}
                className="w-full bg-amber-400 border-4 border-black px-6 py-3 font-bold shadow-[3px_3px_0_0_#000] hover:shadow-[1px_1px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
              >
                {isLoadingInterview ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    {t("buttons.loading")}
                  </span>
                ) : (
                  t("buttons.startInterview")
                )}
              </button>
              <p className="text-xs text-gray-500">{t("cultureTime")}</p>
            </div>
          </div>
        );
    }
  };

  // Determine if we should show the skip button on culture step
  const showSkipButton = step === "culture" && !showInterview && !culturalProfile;

  return (
    <div className="max-w-lg mx-auto">
      <div className="border-4 border-black bg-white p-6 shadow-brutal">
        <div className="text-center mb-8">
          <h1 className="font-head text-3xl mb-2">
            {isAddingNewJourney ? "Add New Journey" : t("title")}
          </h1>
          <p className="text-gray-600">
            {isAddingNewJourney ? "Set up another migration corridor" : t("subtitle")}
          </p>
        </div>

        <div className="mb-8">
          <ProgressIndicator currentStep={currentStep + 1} totalSteps={steps.length} />
        </div>

        <div className="min-h-[300px]">{renderStepContent()}</div>

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 && !showInterview}
            className={`border-4 border-black px-6 py-2 font-bold transition-all ${
              currentStep === 0 && !showInterview
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white shadow-brutal hover:shadow-none hover:translate-y-0.5"
            }`}
          >
            {t("buttons.back")}
          </button>

          {step === "culture" ? (
            // Culture step: Skip or Continue to Dashboard
            showSkipButton ? (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className={`border-4 border-black px-6 py-2 font-bold transition-all ${
                  isSubmitting
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 shadow-brutal hover:shadow-none hover:translate-y-0.5"
                }`}
              >
                {isSubmitting ? t("buttons.completing") : t("buttons.skipForNow")}
              </button>
            ) : culturalProfile ? (
              <button
                type="button"
                onClick={handleComplete}
                disabled={isSubmitting}
                className={`border-4 border-black px-6 py-2 font-bold transition-all ${
                  isSubmitting
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-black text-white shadow-brutal hover:shadow-none hover:translate-y-0.5"
                }`}
              >
                {isSubmitting ? t("buttons.completing") : t("buttons.complete")}
              </button>
            ) : null
          ) : isAddingNewJourney && step === "visa" ? (
            // For new journeys, visa is the last step - show Complete
            <button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting}
              className={`border-4 border-black px-6 py-2 font-bold transition-all ${
                isSubmitting
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white shadow-brutal hover:shadow-none hover:translate-y-0.5"
              }`}
            >
              {isSubmitting ? t("buttons.completing") : "Create Journey"}
            </button>
          ) : currentStep === steps.length - 2 && !isAddingNewJourney ? (
            // Visa step (before culture) for regular onboarding - show Next
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className={`border-4 border-black px-6 py-2 font-bold transition-all ${
                !canProceed()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white shadow-brutal hover:shadow-none hover:translate-y-0.5"
              }`}
            >
              {t("buttons.next")}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              className={`border-4 border-black px-6 py-2 font-bold transition-all ${
                !canProceed()
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white shadow-brutal hover:shadow-none hover:translate-y-0.5"
              }`}
            >
              {t("buttons.next")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
