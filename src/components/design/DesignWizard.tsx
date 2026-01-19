"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, User, Users, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type Gender = "man" | "woman" | "unisex";
type JewelryType = "ring" | "necklace" | "bracelet" | "earrings";
type Style = "classic" | "modern" | "vintage" | "minimalist" | "bold";

interface DesignWizardProps {
  initialStep?: number;
}

export function DesignWizard({ initialStep = 1 }: DesignWizardProps) {
  const t = useTranslations("design.wizard");
  const router = useRouter();

  const [step, setStep] = useState(initialStep);
  const [gender, setGender] = useState<Gender | null>(null);
  const [jewelryType, setJewelryType] = useState<JewelryType | null>(null);
  const [style, setStyle] = useState<Style | null>(null);

  const genderOptions: { value: Gender; label: string; icon: React.ElementType }[] = [
    { value: "woman", label: t("step1.woman"), icon: User },
    { value: "man", label: t("step1.man"), icon: User },
    { value: "unisex", label: t("step1.unisex"), icon: Users },
  ];

  const jewelryOptions: { value: JewelryType; label: string; emoji: string }[] = [
    { value: "ring", label: t("step2.ring"), emoji: "💍" },
    { value: "necklace", label: t("step2.necklace"), emoji: "📿" },
    { value: "bracelet", label: t("step2.bracelet"), emoji: "⌚" },
    { value: "earrings", label: t("step2.earrings"), emoji: "💎" },
  ];

  const styleOptions: { value: Style; label: string }[] = [
    { value: "classic", label: t("step3.classic") },
    { value: "modern", label: t("step3.modern") },
    { value: "vintage", label: t("step3.vintage") },
    { value: "minimalist", label: t("step3.minimalist") },
    { value: "bold", label: t("step3.bold") },
  ];

  const canProceed = () => {
    switch (step) {
      case 1:
        return gender !== null;
      case 2:
        return jewelryType !== null;
      case 3:
        return style !== null;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Navigate to design studio with selections
      const params = new URLSearchParams({
        gender: gender!,
        type: jewelryType!,
        style: style!,
      });
      router.push(`/design/studio?${params.toString()}`);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-center mb-10">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2",
                s === step
                  ? "bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 border-gold-400 shadow-lg shadow-gold-500/30"
                  : s < step
                  ? "bg-gold-500/20 text-gold-400 border-gold-500/50"
                  : "bg-dark-800 text-dark-400 border-dark-700"
              )}
            >
              {s < step ? <Check className="h-5 w-5" /> : s}
            </div>
            {s < 3 && (
              <div
                className={cn(
                  "w-20 h-1 mx-3 rounded-full transition-all duration-500",
                  s < step ? "bg-gradient-to-r from-gold-500 to-gold-400" : "bg-dark-700"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Gender Selection */}
      {step === 1 && (
        <div className="text-center animate-fade-in-up">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-dark-100">{t("step1.title")}</h2>
          <p className="text-dark-400 mb-8">{t("step1.subtitle")}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {genderOptions.map((option, index) => (
              <button
                key={option.value}
                onClick={() => setGender(option.value)}
                className={cn(
                  "p-6 rounded-2xl border transition-all duration-300 animate-fade-in-up group",
                  gender === option.value
                    ? "border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/20"
                    : "border-dark-700 bg-dark-800/50 hover:border-gold-500/50 hover:bg-dark-800"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn(
                  "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all",
                  gender === option.value
                    ? "bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900"
                    : "bg-dark-700 text-dark-300 group-hover:bg-dark-600"
                )}>
                  <option.icon className="h-8 w-8" />
                </div>
                <span className={cn(
                  "font-semibold text-lg transition-colors",
                  gender === option.value ? "text-gold-400" : "text-dark-200"
                )}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Jewelry Type Selection */}
      {step === 2 && (
        <div className="text-center animate-fade-in-up">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-dark-100">{t("step2.title")}</h2>
          <p className="text-dark-400 mb-8">{t("step2.subtitle")}</p>

          <div className="grid grid-cols-2 gap-4">
            {jewelryOptions.map((option, index) => (
              <button
                key={option.value}
                onClick={() => setJewelryType(option.value)}
                className={cn(
                  "p-8 rounded-2xl border transition-all duration-300 animate-fade-in-up group",
                  jewelryType === option.value
                    ? "border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/20"
                    : "border-dark-700 bg-dark-800/50 hover:border-gold-500/50 hover:bg-dark-800"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-5xl mb-4 block filter group-hover:scale-110 transition-transform">{option.emoji}</span>
                <span className={cn(
                  "font-semibold text-lg transition-colors",
                  jewelryType === option.value ? "text-gold-400" : "text-dark-200"
                )}>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Style Selection */}
      {step === 3 && (
        <div className="text-center animate-fade-in-up">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-dark-100">{t("step3.title")}</h2>
          <p className="text-dark-400 mb-8">{t("step3.subtitle")}</p>

          <div className="flex flex-wrap justify-center gap-3">
            {styleOptions.map((option, index) => (
              <button
                key={option.value}
                onClick={() => setStyle(option.value)}
                className={cn(
                  "px-8 py-4 rounded-full border transition-all duration-300 font-semibold animate-fade-in-up",
                  style === option.value
                    ? "border-gold-500 bg-gradient-to-r from-gold-500 to-gold-400 text-dark-900 shadow-lg shadow-gold-500/30"
                    : "border-dark-700 bg-dark-800/50 text-dark-200 hover:border-gold-500/50 hover:bg-dark-800"
                )}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-12">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={step === 1}
          className={cn(step === 1 ? "invisible" : "")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back")}
        </Button>

        <Button
          variant="gradient"
          onClick={handleNext}
          disabled={!canProceed()}
          className="min-w-[160px]"
        >
          {step === 3 ? t("startDesigning") : t("next")}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
