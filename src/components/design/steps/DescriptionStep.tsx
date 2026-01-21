"use client";

import { useTranslations } from "next-intl";
import { Sparkles, Lightbulb } from "lucide-react";
import { useDesignWizard } from "@/contexts/DesignWizardContext";
import { cn } from "@/lib/utils/cn";

export function DescriptionStep() {
  const t = useTranslations("design.wizard.description");
  const tTypes = useTranslations("design.wizard.step2");
  const { jewelryType, description, setDescription } = useDesignWizard();

  const maxLength = 500;
  const charCount = description.length;

  // Example prompts based on jewelry type
  const examplePrompts: Record<string, string[]> = {
    ring: [
      t("examples.ring.classic"),
      t("examples.ring.modern"),
      t("examples.ring.vintage"),
      t("examples.ring.bold"),
    ],
    necklace: [
      t("examples.necklace.delicate"),
      t("examples.necklace.statement"),
      t("examples.necklace.layered"),
      t("examples.necklace.pendant"),
    ],
    bracelet: [
      t("examples.bracelet.tennis"),
      t("examples.bracelet.cuff"),
      t("examples.bracelet.chain"),
      t("examples.bracelet.bangle"),
    ],
    earrings: [
      t("examples.earrings.studs"),
      t("examples.earrings.drops"),
      t("examples.earrings.hoops"),
      t("examples.earrings.threader"),
    ],
  };

  const examples = jewelryType ? examplePrompts[jewelryType] || [] : [];
  const typeLabel = jewelryType ? tTypes(jewelryType) : "";

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient">
          {t("title", { type: typeLabel })}
        </h2>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Textarea */}
        <div className="relative">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, maxLength))}
            placeholder={t("placeholder", { type: typeLabel.toLowerCase() })}
            className={cn(
              "w-full min-h-[180px] p-5 rounded-2xl border-2 transition-all resize-none",
              "bg-bg-secondary text-text-primary placeholder:text-text-tertiary",
              "focus:outline-none focus:border-accent-primary/50 focus:ring-2 focus:ring-accent-primary/20",
              description.length >= 10
                ? "border-accent-primary/30"
                : "border-border"
            )}
          />

          {/* Character counter */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <span
              className={cn(
                "text-sm transition-colors",
                charCount >= maxLength
                  ? "text-red-500"
                  : charCount >= 10
                  ? "text-accent-primary"
                  : "text-text-tertiary"
              )}
            >
              {t("charCount", { count: charCount, max: maxLength })}
            </span>
          </div>
        </div>

        {/* Hint */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-bg-secondary/50 border border-border">
          <Lightbulb className="w-5 h-5 text-accent-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-text-secondary">{t("hint")}</p>
        </div>

        {/* Example prompts */}
        {examples.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <Sparkles className="w-4 h-4 text-accent-primary" />
              <span>{t("examples.title")}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setDescription(example)}
                  className={cn(
                    "px-4 py-2 text-sm rounded-xl border transition-all",
                    "bg-bg-secondary border-border text-text-secondary",
                    "hover:border-accent-primary/50 hover:text-accent-primary hover:bg-bg-tertiary",
                    "animate-fade-in-up"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
