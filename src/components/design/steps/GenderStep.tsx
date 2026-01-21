"use client";

import { useTranslations } from "next-intl";
import { User, Users, Check } from "lucide-react";
import { useDesignWizard, Gender } from "@/contexts/DesignWizardContext";
import { cn } from "@/lib/utils/cn";

const genderOptions: { value: Gender; icon: typeof User }[] = [
  { value: "man", icon: User },
  { value: "woman", icon: User },
  { value: "unisex", icon: Users },
];

export function GenderStep() {
  const t = useTranslations("design.wizard.step1");
  const { gender, setGender } = useDesignWizard();

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient">
          {t("title")}
        </h2>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {genderOptions.map((option, index) => {
          const Icon = option.icon;
          const isSelected = gender === option.value;

          return (
            <button
              key={option.value}
              onClick={() => setGender(option.value)}
              className={cn(
                "relative p-4 rounded-2xl border-2 transition-all duration-300 group",
                "flex flex-col items-center gap-3",
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
                  "w-14 h-14 rounded-xl flex items-center justify-center transition-all",
                  isSelected
                    ? "bg-gradient-to-br from-accent-primary to-accent-secondary shadow-lg shadow-accent/30"
                    : "bg-bg-tertiary group-hover:bg-bg-accent"
                )}
              >
                <Icon
                  className={cn(
                    "w-8 h-8 transition-colors",
                    isSelected ? "text-text-inverse" : "text-text-tertiary group-hover:text-accent-primary"
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
                {t(option.value)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
