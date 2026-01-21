"use client";

import { useTranslations } from "next-intl";
import { CircleDot, Link, Link2, Gem, LucideIcon, Check } from "lucide-react";
import { useDesignWizard, JewelryType } from "@/contexts/DesignWizardContext";
import { cn } from "@/lib/utils/cn";

const jewelryTypes: { value: JewelryType; icon: LucideIcon }[] = [
  { value: "ring", icon: CircleDot },
  { value: "necklace", icon: Link },
  { value: "bracelet", icon: Link2 },
  { value: "earrings", icon: Gem },
];

export function JewelryTypeStep() {
  const t = useTranslations("design.wizard.step2");
  const { jewelryType, setJewelryType } = useDesignWizard();

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient">
          {t("title")}
        </h2>
        <p className="text-text-secondary">{t("subtitle")}</p>
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
                "animate-fade-in-up hover-lift",
                isSelected
                  ? "border-accent-primary bg-accent-primary/10 shadow-lg shadow-accent/20"
                  : "border-border bg-bg-secondary hover:border-accent-primary/50 hover:bg-bg-tertiary"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-accent-primary rounded-full flex items-center justify-center animate-scale-in">
                  <Check className="w-4 h-4 text-text-inverse" />
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-accent-primary/20 scale-110"
                    : "bg-bg-tertiary group-hover:bg-bg-accent group-hover:scale-105"
                )}
              >
                <type.icon
                  className={cn(
                    "w-8 h-8 transition-colors",
                    isSelected ? "text-accent-primary" : "text-text-tertiary group-hover:text-text-secondary"
                  )}
                />
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-lg font-semibold transition-colors",
                  isSelected ? "text-accent-primary" : "text-text-primary group-hover:text-text-primary"
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
