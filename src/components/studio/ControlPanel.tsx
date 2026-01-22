"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, Loader2, DollarSign, AlertTriangle, X } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
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

  // Fetch price estimate when material or jewelry type changes
  useEffect(() => {
    if (!jewelryType || !material) return;

    const fetchPrice = async () => {
      try {
        const response = await fetch(
          `/api/pricing/estimate?material=${material}&type=${jewelryType}&complexity=moderate&size=medium`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.breakdown?.total) {
            setPriceEstimate(data.breakdown.total);
          }
        }
      } catch (error) {
        console.error("Price fetch error:", error);
      }
    };

    fetchPrice();
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
        !compact && "glass-card rounded-2xl p-4",
        className
      )}
    >
      <div className={cn("flex-1 overflow-y-auto space-y-3", compact && "space-y-2")}>
        {/* Gender Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">
            {t("controls.gender")}
          </label>
          <div className="flex gap-2">
            {genderOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setGender(option.value)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200",
                  gender === option.value
                    ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-glow"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-accent hover:text-text-primary border border-border"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jewelry Type */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">
            {t("controls.type")}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {jewelryTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setJewelryType(type.value)}
                className={cn(
                  "py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200",
                  jewelryType === type.value
                    ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-glow"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-accent hover:text-text-primary border border-border"
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Material Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">
            {t("controls.material")}
          </label>
          <div className="flex flex-wrap gap-2">
            {materials.map((mat) => (
              <button
                key={mat.value}
                onClick={() => setMaterial(mat.value)}
                className={cn(
                  "py-2 px-4 rounded-xl text-sm font-medium transition-all duration-200",
                  material === mat.value
                    ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-glow"
                    : "bg-bg-tertiary text-text-secondary hover:bg-bg-accent hover:text-text-primary border border-border"
                )}
              >
                {mat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-text-secondary">
              {t("controls.description")}
            </label>
            <span className={cn(
              "text-xs",
              description.trim().length >= 10 ? "text-text-tertiary" : "text-accent-primary"
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
              "w-full px-3 py-2 rounded-xl resize-none text-sm",
              "bg-bg-tertiary border border-border",
              "text-text-primary placeholder:text-text-tertiary",
              "focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Generate Button with inline price */}
        <div className="space-y-2">
          <Button
            variant="gradient"
            size="lg"
            className="w-full gap-2"
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

          {/* Inline price estimate */}
          {!compact && jewelryType && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-text-tertiary">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{tPricing("title")}:</span>
              </div>
              {priceEstimate ? (
                <span className="font-semibold text-accent-primary">
                  {new Intl.NumberFormat("he-IL", {
                    style: "currency",
                    currency: "ILS",
                    maximumFractionDigits: 0,
                  }).format(priceEstimate)}
                </span>
              ) : (
                <span className="text-text-tertiary">—</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Regenerate Warning Dialog */}
      {showRegenerateWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowRegenerateWarning(false)}
          />

          {/* Dialog */}
          <div className="relative bg-bg-primary border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl">
            {/* Close button */}
            <button
              onClick={() => setShowRegenerateWarning(false)}
              className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {t("regenerateWarning.title")}
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              {t("regenerateWarning.message")}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
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
