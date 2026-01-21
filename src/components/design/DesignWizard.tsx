"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Sparkles, User, Gem, PenLine, Image, MessageSquare } from "lucide-react";
import { useDesignWizard, DesignWizardProvider } from "@/contexts/DesignWizardContext";
import { Button } from "@/components/ui/Button";
import {
  GenderStep,
  JewelryTypeStep,
  DescriptionStep,
  ImageSelectionStep,
  ImageRefinementStep,
  FinalReviewStep,
} from "./steps";
import { cn } from "@/lib/utils/cn";

const TOTAL_STEPS = 6;

const StepIcons = [User, Gem, PenLine, Image, MessageSquare, Sparkles];

function WizardContent() {
  const t = useTranslations("design.wizard");
  const tSteps = useTranslations("design.wizard.steps");

  const { step, nextStep, prevStep, canProceed, selectedImageUrl } = useDesignWizard();

  const stepLabels = [
    tSteps("gender"),
    tSteps("type"),
    tSteps("description"),
    tSteps("select"),
    tSteps("refine"),
    tSteps("review"),
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return <GenderStep />;
      case 2:
        return <JewelryTypeStep />;
      case 3:
        return <DescriptionStep />;
      case 4:
        return <ImageSelectionStep />;
      case 5:
        return <ImageRefinementStep />;
      case 6:
        return <FinalReviewStep />;
      default:
        return null;
    }
  };

  const getNextButtonText = () => {
    switch (step) {
      case 3:
        return t("generateDesigns");
      case 4:
        return t("next"); // Select image step
      case 5:
        return t("convertTo3D");
      case 6:
        return null; // No next button on final step
      default:
        return t("next");
    }
  };

  const canGoNext = () => {
    if (step === 4) {
      // On image selection step, need a selected image to proceed
      return selectedImageUrl !== null;
    }
    return canProceed();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-10">
        {/* Step labels (desktop) */}
        <div className="hidden md:flex items-center justify-between mb-4 px-2">
          {stepLabels.map((label, index) => (
            <div
              key={index}
              className={cn(
                "text-sm font-medium transition-colors flex-1 text-center",
                index + 1 === step
                  ? "text-accent-primary"
                  : index + 1 < step
                  ? "text-text-secondary"
                  : "text-text-tertiary"
              )}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center">
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => {
            const stepNum = index + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;

            return (
              <div key={stepNum} className="flex items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2",
                    isCurrent
                      ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-text-inverse border-accent-primary shadow-lg shadow-accent/30 scale-110"
                      : isCompleted
                      ? "bg-accent-primary/20 text-accent-primary border-accent-primary/50"
                      : "bg-bg-secondary text-text-tertiary border-border"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    (() => {
                      const Icon = StepIcons[index];
                      return <Icon className="h-5 w-5" />;
                    })()
                  )}
                </div>
                {stepNum < TOTAL_STEPS && (
                  <div
                    className={cn(
                      "w-8 md:w-16 h-1 mx-1 md:mx-2 rounded-full transition-all duration-500",
                      isCompleted
                        ? "bg-gradient-to-r from-accent-primary to-accent-secondary"
                        : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Current step label (mobile) */}
        <div className="md:hidden text-center mt-4">
          <span className="text-sm text-accent-primary font-medium">
            {stepLabels[step - 1]}
          </span>
          <span className="text-sm text-text-tertiary mx-2">•</span>
          <span className="text-sm text-text-tertiary">
            {t("stepOf", { current: step, total: TOTAL_STEPS })}
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStep()}</div>

      {/* Navigation buttons */}
      {step < 6 && (
        <div className="flex justify-between mt-10 pt-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1}
            className={cn(step === 1 ? "invisible" : "")}
          >
            <ArrowLeft className="mr-2 rtl:mr-0 rtl:ml-2 h-4 w-4 rtl:rotate-180" />
            {t("back")}
          </Button>

          <Button
            variant="gradient"
            onClick={nextStep}
            disabled={!canGoNext()}
            className="min-w-[180px] gap-2"
          >
            {step === 3 && <Sparkles className="h-4 w-4" />}
            {getNextButtonText()}
            {step !== 3 && <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
          </Button>
        </div>
      )}
    </div>
  );
}

export function DesignWizard() {
  return (
    <DesignWizardProvider>
      <WizardContent />
    </DesignWizardProvider>
  );
}
