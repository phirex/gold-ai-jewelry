"use client";

import { useTranslations } from "next-intl";
import { Circle, Gem } from "lucide-react";
import { useDesignWizard, JewelryType } from "@/contexts/DesignWizardContext";
import { cn } from "@/lib/utils/cn";

const jewelryTypes: { value: JewelryType; emoji: string }[] = [
  { value: "ring", emoji: "💍" },
  { value: "necklace", emoji: "📿" },
  { value: "bracelet", emoji: "⌚" },
  { value: "earrings", emoji: "💎" },
];

export function JewelryTypeStep() {
  const t = useTranslations("design.wizard.step2");
  const { jewelryType, setJewelryType } = useDesignWizard();

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient-gold-bright">
          {t("title")}
        </h2>
        <p className="text-dark-400">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {jewelryTypes.map((type, index) => {
          const isSelected = jewelryType === type.value;

          return (
            <button
              key={type.value}
              onClick={() => setJewelryType(type.value)}
              className={cn(
                "relative p-6 rounded-2xl border-2 transition-all duration-300 group",
                "flex flex-col items-center gap-4",
                "animate-fade-in-up",
                isSelected
                  ? "border-gold-500 bg-gold-500/10 shadow-lg shadow-gold-500/20"
                  : "border-dark-700 bg-dark-800 hover:border-gold-500/50 hover:bg-dark-750"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center animate-scale-in">
                  <svg
                    className="w-4 h-4 text-dark-900"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Emoji Icon */}
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all",
                  isSelected
                    ? "bg-gradient-to-br from-gold-500/20 to-gold-400/20 scale-110"
                    : "bg-dark-700 group-hover:bg-dark-600 group-hover:scale-105"
                )}
              >
                {type.emoji}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-lg font-semibold transition-colors",
                  isSelected ? "text-gold-400" : "text-dark-200 group-hover:text-dark-100"
                )}
              >
                {t(type.value)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
