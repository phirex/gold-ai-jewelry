"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2, DollarSign, AlertTriangle, X } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface ControlPanelProps {
  className?: string;
  compact?: boolean;
}

export function ControlPanel({ className, compact = false }: ControlPanelProps) {
  const t = useTranslations("studio");
  const tWizard = useTranslations("design.wizard");
  const tPricing = useTranslations("design.pricing");
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
    variations,
    setVariations,
    addToHistory,
    canGenerate,
    priceEstimate,
    setPriceEstimate,
    resetConversion,
    currentDesignId,
    setCurrentDesignId,
  } = useStudio();

  const [showRegenerateWarning, setShowRegenerateWarning] = useState(false);

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

  // Clear price estimate when material or jewelry type changes
  // Price will be calculated accurately AFTER image generation via Claude Vision analysis
  useEffect(() => {
    // Reset price when design parameters change - accurate price comes after image generation
    setPriceEstimate(null);
  }, [jewelryType, material, setPriceEstimate]);

  // Check if there are existing images
  const hasExistingImages = variations[0] || variations[1];

  const handleGenerateClick = () => {
    if (!canGenerate()) return;

    // If images already exist, show warning dialog
    if (hasExistingImages) {
      setShowRegenerateWarning(true);
      return;
    }

    // Otherwise generate directly
    doGenerate();
  };

  const doGenerate = async () => {
    setShowRegenerateWarning(false);
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

      // Add first image to history
      if (images[0]) {
        addToHistory(images[0]);
      }

      // Save design to database with the first image as thumbnail
      // Price will be calculated when user SELECTS their preferred variation
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
            // Price will be calculated in PreviewPanel.handleSelectAndConfirm
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
    <div
      className={cn(
        "h-full flex flex-col",
        !compact && (isApple 
          ? "bg-[#FBFBFD] border border-[#E8E8ED] rounded-2xl overflow-hidden"
          : "glass-card rounded-2xl overflow-hidden"),
        className
      )}
    >
      <div className={cn(
        "flex-1 overflow-y-auto",
        isApple ? "space-y-5 p-5 pb-2" : "space-y-3 p-4 pb-2", 
        compact && "space-y-2 p-3"
      )}>
        {/* Gender Selection */}
        <div className={cn("space-y-2", isApple && "space-y-3")}>
          <label className={cn(
            "font-medium",
            isApple ? "text-xs text-[#6E6E73] uppercase tracking-wide" : "text-sm text-text-secondary"
          )}>
            {t("controls.gender")}
          </label>
          <div className="flex gap-2">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setGender(option.value)}
                className={cn(
                  "flex-1 font-medium transition-all",
                  isApple 
                    ? cn(
                        "py-2.5 px-3 rounded-lg text-[13px] tracking-[-0.01em]",
                        gender === option.value
                          ? "bg-[#1D1D1F] text-white"
                          : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EFEFEF] active:scale-[0.98]"
                      )
                    : cn(
                        "py-2 px-3 rounded-xl text-sm duration-200",
                        gender === option.value
                          ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-glow"
                          : "bg-bg-tertiary text-text-secondary hover:bg-bg-accent hover:text-text-primary border border-border"
                      )
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jewelry Type */}
        <div className={cn("space-y-2", isApple && "space-y-3")}>
          <label className={cn(
            "font-medium",
            isApple ? "text-xs text-[#6E6E73] uppercase tracking-wide" : "text-sm text-text-secondary"
          )}>
            {t("controls.type")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {jewelryTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setJewelryType(type.value)}
                className={cn(
                  "font-medium transition-all",
                  isApple 
                    ? cn(
                        "py-2.5 px-3 rounded-lg text-[13px] tracking-[-0.01em]",
                        jewelryType === type.value
                          ? "bg-[#1D1D1F] text-white"
                          : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EFEFEF] active:scale-[0.98]"
                      )
                    : cn(
                        "py-2.5 px-3 rounded-xl text-sm duration-200",
                        jewelryType === type.value
                          ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-glow"
                          : "bg-bg-tertiary text-text-secondary hover:bg-bg-accent hover:text-text-primary border border-border"
                      )
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Material Selection */}
        <div className={cn("space-y-2", isApple && "space-y-3")}>
          <label className={cn(
            "font-medium",
            isApple ? "text-xs text-[#6E6E73] uppercase tracking-wide" : "text-sm text-text-secondary"
          )}>
            {t("controls.material")}
          </label>
          <div className="flex flex-wrap gap-2">
            {materials.map((mat) => (
              <button
                key={mat.value}
                onClick={() => setMaterial(mat.value)}
                className={cn(
                  "font-medium transition-all",
                  isApple 
                    ? cn(
                        "py-2 px-4 rounded-full text-[13px] tracking-[-0.01em]",
                        material === mat.value
                          ? "bg-[#1D1D1F] text-white"
                          : "bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#EFEFEF] active:scale-[0.98]"
                      )
                    : cn(
                        "py-2 px-4 rounded-xl text-sm duration-200",
                        material === mat.value
                          ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-glow"
                          : "bg-bg-tertiary text-text-secondary hover:bg-bg-accent hover:text-text-primary border border-border"
                      )
                )}
              >
                {mat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className={cn(
          "border-t",
          isApple ? "border-[#E8E8ED]" : "border-border"
        )} />

        {/* Description */}
        <div className={cn("space-y-1.5", isApple && "space-y-2")}>
          <div className="flex items-center justify-between">
            <label className={cn(
              "font-medium",
              isApple ? "text-xs text-[#6E6E73] uppercase tracking-wide" : "text-sm text-text-secondary"
            )}>
              {t("controls.description")}
            </label>
            <span className={cn(
              "text-xs",
              isApple 
                ? (description.trim().length >= 10 ? "text-[#86868B]" : "text-[#86868B]")
                : (description.trim().length >= 10 ? "text-text-tertiary" : "text-accent-primary")
            )}>
              {description.trim().length}/10
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("controls.descriptionPlaceholder")}
            rows={compact ? 2 : 3}
            className={cn(
              "w-full resize-none transition-all",
              isApple 
                ? cn(
                    "px-4 py-3 rounded-xl text-[15px] tracking-[-0.01em]",
                    "bg-[#F5F5F7] border border-transparent",
                    "text-[#1D1D1F] placeholder:text-[#86868B]",
                    "focus:outline-none focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15"
                  )
                : cn(
                    "px-3 py-2 rounded-xl text-sm duration-200",
                    "bg-bg-tertiary border border-border",
                    "text-text-primary placeholder:text-text-tertiary",
                    "focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary"
                  )
            )}
          />
        </div>
      </div>

      {/* Generate Button - Sticky at bottom */}
      <div className={cn(
        "sticky bottom-0 border-t",
        isApple 
          ? "bg-[#FBFBFD] border-[#E8E8ED] p-5 pt-4"
          : "bg-bg-primary/95 backdrop-blur-sm border-border p-4 pt-3"
      )}>
        <Button
          variant="gradient"
          size="lg"
          className={cn(
            "w-full gap-2",
            isApple && "bg-[#1D1D1F] hover:bg-[#3A3A3C]"
          )}
          onClick={handleGenerateClick}
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

        {/* Inline price estimate - only shown after image generation */}
        {!compact && jewelryType && priceEstimate && (
          <div className={cn(
            "flex items-center justify-between text-sm mt-3",
            isApple && "mt-2"
          )}>
            <div className={cn(
              "flex items-center gap-1.5",
              isApple ? "text-[#6E6E73]" : "text-text-tertiary"
            )}>
              <DollarSign className="w-3.5 h-3.5" />
              <span>{tPricing("title")}:</span>
            </div>
            <span 
              className={cn(
                "font-semibold",
                isApple ? "text-[#1D1D1F]" : "text-accent-primary"
              )}
              style={{ direction: 'ltr' }}
            >
              {new Intl.NumberFormat("he-IL", {
                style: "currency",
                currency: "ILS",
                maximumFractionDigits: 0,
              }).format(priceEstimate)}
            </span>
          </div>
        )}
      </div>

      {/* Regenerate Warning Dialog */}
      {showRegenerateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className={cn(
              "absolute inset-0",
              isApple ? "bg-black/40 backdrop-blur-xl" : "bg-black/50 backdrop-blur-sm"
            )}
            onClick={() => setShowRegenerateWarning(false)}
          />

          {/* Dialog */}
          <div className={cn(
            "relative p-6 max-w-sm w-full",
            isApple 
              ? "bg-[#FBFBFD] border border-[#E8E8ED] rounded-2xl shadow-[0_22px_70px_4px_rgba(0,0,0,0.12)]"
              : "bg-bg-primary border border-border rounded-2xl shadow-xl"
          )}>
            {/* Close button */}
            <button
              onClick={() => setShowRegenerateWarning(false)}
              className={cn(
                "absolute top-4 right-4 transition-colors",
                isApple 
                  ? "text-[#86868B] hover:text-[#1D1D1F]"
                  : "text-text-tertiary hover:text-text-primary"
              )}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center mb-4",
              isApple ? "bg-[#FF9500]/10" : "bg-amber-500/10"
            )}>
              <AlertTriangle className={cn(
                "w-6 h-6",
                isApple ? "text-[#FF9500]" : "text-amber-500"
              )} />
            </div>

            {/* Content */}
            <h3 className={cn(
              "text-lg font-semibold mb-2",
              isApple ? "text-[#1D1D1F] tracking-[-0.02em]" : "text-text-primary"
            )}>
              {t("regenerateWarning.title")}
            </h3>
            <p className={cn(
              "text-sm mb-6",
              isApple ? "text-[#6E6E73] leading-relaxed" : "text-text-secondary"
            )}>
              {t("regenerateWarning.message")}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowRegenerateWarning(false)}
              >
                {t("regenerateWarning.cancel")}
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                onClick={doGenerate}
              >
                {t("regenerateWarning.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
