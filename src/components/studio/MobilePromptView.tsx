"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2, Wand2 } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function MobilePromptView() {
  const t = useTranslations("studio");
  const tWizard = useTranslations("design.wizard");
  const { theme } = useTheme();
  const isApple = theme === "minimal";

  const {
    gender,
    setGender,
    jewelryType,
    setJewelryType,
    material,
    setMaterial,
    description,
    setDescription,
    isGenerating,
    setIsGenerating,
    setVariations,
    addToHistory,
    canGenerate,
    resetConversion,
    setCurrentDesignId,
    setPriceEstimate,
  } = useStudio();

  const genderOptions = [
    { value: "man" as const, label: tWizard("step1.man") },
    { value: "woman" as const, label: tWizard("step1.woman") },
    { value: "unisex" as const, label: tWizard("step1.unisex") },
  ];

  const jewelryTypes = [
    { value: "ring" as const, label: tWizard("step2.ring") },
    { value: "necklace" as const, label: tWizard("step2.necklace") },
    { value: "bracelet" as const, label: tWizard("step2.bracelet") },
    { value: "earrings" as const, label: tWizard("step2.earrings") },
  ];

  const materials = [
    { value: "gold_14k" as const, label: "14K" },
    { value: "gold_18k" as const, label: "18K" },
    { value: "gold_24k" as const, label: "24K" },
    { value: "silver" as const, label: "Ag" },
    { value: "platinum" as const, label: "Pt" },
  ];

  const handleGenerate = async () => {
    if (!canGenerate()) return;

    setIsGenerating(true);
    resetConversion();

    try {
      const response = await fetch("/api/designs/generate-variations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: description,
          jewelryType,
          gender,
          material,
          count: 2,
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const data = await response.json();
      const images = data.images as string[];

      setVariations([images[0] || null, images[1] || null]);

      if (images[0]) {
        addToHistory(images[0]);
      }

      // Save design to database - price calculated when user selects a variation
      if (images[0] && jewelryType && gender) {
        try {
          const saveResponse = await fetch("/api/designs/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: description,
              jewelryType,
              targetGender: gender,
              material,
              thumbnailUrl: images[0],
              status: "draft",
            }),
          });
          
          if (saveResponse.ok) {
            const saveData = await saveResponse.json();
            // Store design ID for future updates
            if (saveData.design?.id) {
              setCurrentDesignId(saveData.design.id);
            }
            // DON'T set price here - wait until user selects a variation
          }
        } catch (saveError) {
          console.error("Failed to save design:", saveError);
          // Non-blocking - continue even if save fails
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn(
      "flex-1 flex flex-col overflow-hidden",
      isApple ? "bg-[#FBFBFD]" : ""
    )}>
      {/* Scrollable options area */}
      <div className="flex-1 overflow-y-auto p-4 pb-2">
        {/* Compact Header */}
        <div className="text-center mb-4 pt-2">
          <div className={cn(
            "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-2",
            isApple 
              ? "bg-[#F5F5F7]"
              : "bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20"
          )}>
            <Wand2 className={cn(
              "w-6 h-6",
              isApple ? "text-[#1D1D1F]" : "text-accent-primary"
            )} />
          </div>
          <h1 className={cn(
            "text-xl font-bold",
            isApple ? "text-[#1D1D1F] tracking-[-0.02em]" : "text-text-primary"
          )}>
            {t("emptyState.title")}
          </h1>
        </div>

        {/* Description textarea - Primary input at top */}
        <div className="mb-5">
          <label className={cn(
            "block mb-2 font-semibold",
            isApple ? "text-[13px] text-[#1D1D1F] tracking-[-0.01em]" : "text-base text-text-primary"
          )}>
            {t("controls.description")}
          </label>
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("controls.descriptionPlaceholder")}
              rows={4}
              className={cn(
                "w-full resize-none transition-all",
                isApple
                  ? cn(
                      "px-4 py-4 rounded-2xl text-[16px] tracking-[-0.01em]",
                      "bg-[#F5F5F7] border-2 border-transparent",
                      "text-[#1D1D1F] placeholder:text-[#86868B]",
                      "focus:outline-none focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15"
                    )
                  : cn(
                      "px-4 py-4 rounded-2xl text-base",
                      "bg-bg-tertiary border-2 border-border",
                      "text-text-primary placeholder:text-text-tertiary",
                      "focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50"
                    )
              )}
            />
            {description.length > 0 && description.length < 10 && (
              <span className={cn(
                "absolute right-3 bottom-3 text-xs",
                isApple ? "text-[#86868B]" : "text-text-tertiary"
              )}>
                {10 - description.length} more
              </span>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className={cn(
          "border-t mb-4",
          isApple ? "border-[#E8E8ED]" : "border-border"
        )} />

        {/* Compact form options */}
        <div className={cn("space-y-4", isApple && "space-y-4")}>
          {/* Gender Selection */}
          <div className={cn("space-y-1.5", isApple && "space-y-2")}>
            <label className={cn(
              "font-medium",
              isApple ? "text-[10px] text-[#6E6E73] uppercase tracking-wide" : "text-xs text-text-secondary"
            )}>
              {t("controls.gender")}
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {genderOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGender(option.value)}
                  className={cn(
                    "py-2 px-2 font-medium transition-all",
                    isApple
                      ? cn(
                          "rounded-lg text-[12px] tracking-[-0.01em]",
                          gender === option.value
                            ? "bg-[#1D1D1F] text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EFEFEF] active:scale-[0.98]"
                        )
                      : cn(
                          "rounded-xl text-sm",
                          gender === option.value
                            ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/25"
                            : "bg-bg-tertiary text-text-secondary border border-border hover:border-accent-primary/30"
                        )
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Jewelry Type */}
          <div className={cn("space-y-1.5", isApple && "space-y-2")}>
            <label className={cn(
              "font-medium",
              isApple ? "text-[10px] text-[#6E6E73] uppercase tracking-wide" : "text-xs text-text-secondary"
            )}>
              {t("controls.type")}
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {jewelryTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setJewelryType(type.value)}
                  className={cn(
                    "py-2 px-2 font-medium transition-all",
                    isApple
                      ? cn(
                          "rounded-lg text-[12px] tracking-[-0.01em]",
                          jewelryType === type.value
                            ? "bg-[#1D1D1F] text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EFEFEF] active:scale-[0.98]"
                        )
                      : cn(
                          "rounded-xl text-sm",
                          jewelryType === type.value
                            ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/25"
                            : "bg-bg-tertiary text-text-secondary border border-border hover:border-accent-primary/30"
                        )
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Material */}
          <div className={cn("space-y-1.5", isApple && "space-y-2")}>
            <label className={cn(
              "font-medium",
              isApple ? "text-[10px] text-[#6E6E73] uppercase tracking-wide" : "text-xs text-text-secondary"
            )}>
              {t("controls.material")}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {materials.map((mat) => (
                <button
                  key={mat.value}
                  onClick={() => setMaterial(mat.value)}
                  className={cn(
                    "py-1.5 px-4 font-medium transition-all",
                    isApple
                      ? cn(
                          "rounded-full text-[12px] tracking-[-0.01em]",
                          material === mat.value
                            ? "bg-[#1D1D1F] text-white"
                            : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EFEFEF] active:scale-[0.98]"
                        )
                      : cn(
                          "rounded-xl text-sm",
                          material === mat.value
                            ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-lg shadow-accent-primary/25"
                            : "bg-bg-tertiary text-text-secondary border border-border hover:border-accent-primary/30"
                        )
                  )}
                >
                  {mat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generate button - Fixed at bottom */}
      <div className={cn(
        "sticky bottom-0 left-0 right-0 p-4 pb-6 border-t",
        isApple 
          ? "bg-[#FBFBFD] border-[#E8E8ED]"
          : "bg-bg-primary border-border"
      )}>
        <Button
          variant="gradient"
          size="lg"
          className={cn(
            "w-full gap-2 py-3.5 font-semibold",
            isApple 
              ? "text-[15px] tracking-[-0.01em] bg-[#1D1D1F] hover:bg-[#3A3A3C]"
              : "text-base"
          )}
          onClick={handleGenerate}
          disabled={!canGenerate() || isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t("generating")}
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              {t("generate")}
            </>
          )}
        </Button>

        {!canGenerate() && description.length >= 10 && (
          <p className={cn(
            "text-xs text-center mt-2",
            isApple ? "text-[#86868B]" : "text-text-tertiary"
          )}>
            {t("emptyState.selectAll")}
          </p>
        )}
      </div>
    </div>
  );
}
