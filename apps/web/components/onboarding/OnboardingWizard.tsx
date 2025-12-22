"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { CountrySelector } from "./CountrySelector";
import { StageSelector } from "./StageSelector";
import { ProgressIndicator } from "./ProgressIndicator";
import type { MigrationStage } from "@/lib/constants/stages";

type Step = "origin" | "destination" | "stage" | "visa";

const steps: Step[] = ["origin", "destination", "stage", "visa"];

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    originCountry: "",
    destinationCountry: "",
    stage: "" as MigrationStage | "",
    visaType: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("onboarding");

  const step = steps[currentStep];

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
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!formData.stage) return;

    setIsSubmitting(true);
    try {
      await completeOnboarding({
        originCountry: formData.originCountry,
        destinationCountry: formData.destinationCountry,
        stage: formData.stage,
        visaType: formData.visaType || undefined,
      });
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      setIsSubmitting(false);
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
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="border-4 border-black bg-white p-6 shadow-brutal">
        <div className="text-center mb-8">
          <h1 className="font-head text-3xl mb-2">{t("title")}</h1>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        <div className="mb-8">
          <ProgressIndicator currentStep={currentStep + 1} totalSteps={steps.length} />
        </div>

        <div className="min-h-[300px]">{renderStepContent()}</div>

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`border-4 border-black px-6 py-2 font-bold transition-all ${
              currentStep === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white shadow-brutal hover:shadow-none hover:translate-y-0.5"
            }`}
          >
            {t("buttons.back")}
          </button>

          {currentStep === steps.length - 1 ? (
            <button
              type="button"
              onClick={handleComplete}
              disabled={!canProceed() || isSubmitting}
              className={`border-4 border-black px-6 py-2 font-bold transition-all ${
                !canProceed() || isSubmitting
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white shadow-brutal hover:shadow-none hover:translate-y-0.5"
              }`}
            >
              {isSubmitting ? t("buttons.completing") : t("buttons.complete")}
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
