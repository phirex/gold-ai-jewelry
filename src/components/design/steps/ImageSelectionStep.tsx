"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw, Check } from "lucide-react";
import { useDesignWizard } from "@/contexts/DesignWizardContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function ImageSelectionStep() {
  const t = useTranslations("design.wizard.select");
  const {
    variations,
    setVariations,
    selectedImageUrl,
    setSelectedImageUrl,
    isGenerating,
    setIsGenerating,
    constructPrompt,
    jewelryType,
    gender,
    material,
  } = useDesignWizard();

  // Ref to prevent double-generation in React Strict Mode
  const hasStartedGenerating = useRef(false);

  // Generate initial variations on mount
  useEffect(() => {
    if (variations.length === 0 && !isGenerating && !hasStartedGenerating.current) {
      hasStartedGenerating.current = true;
      generateVariations(constructPrompt());
    }
  }, []);

  const generateVariations = async (prompt: string) => {
    setIsGenerating(true);
    setSelectedImageUrl(null);

    try {
      const response = await fetch("/api/designs/generate-variations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          jewelryType,
          gender,
          material,
          count: 2,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate variations");

      const data = await response.json();
      setVariations(data.images);
    } catch (error) {
      console.error("Error generating variations:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient">
          {t("title")}
        </h2>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Image Grid - 2 images */}
        <div className="grid grid-cols-2 gap-4">
          {Array(2).fill(null).map((_, index) => {
            const imageUrl = variations[index];
            const isLoading = isGenerating && !imageUrl;

            return (
              <button
                key={index}
                onClick={() => imageUrl && !isGenerating && setSelectedImageUrl(imageUrl)}
                disabled={!imageUrl || isGenerating}
                className={cn(
                  "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all",
                  "bg-bg-secondary shadow-medium",
                  imageUrl && selectedImageUrl === imageUrl
                    ? "border-accent-primary ring-4 ring-accent-primary/20 shadow-lg shadow-accent/20"
                    : imageUrl
                    ? "border-border hover:border-accent-primary/50"
                    : "border-border",
                  "animate-fade-in-up"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={`Design variation ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedImageUrl === imageUrl && (
                      <div className="absolute top-3 right-3 w-8 h-8 bg-accent-primary rounded-full flex items-center justify-center animate-scale-in shadow-lg">
                        <Check className="w-5 h-5 text-text-inverse" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="relative">
                          <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-lg animate-pulse" />
                          <Loader2 className="w-8 h-8 text-accent-primary animate-spin relative" />
                        </div>
                        <span className="text-xs text-text-tertiary">{t("generating")}</span>
                      </>
                    ) : (
                      <span className="text-text-tertiary text-sm">#{index + 1}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selection hint */}
        {variations.length > 0 && !selectedImageUrl && !isGenerating && (
          <p className="text-center text-text-secondary text-sm animate-pulse">
            {t("selectOne")}
          </p>
        )}

        {/* Regenerate Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => {
              hasStartedGenerating.current = true;
              generateVariations(constructPrompt());
            }}
            disabled={isGenerating}
            className="gap-2"
          >
            <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            {t("regenerate")}
          </Button>
        </div>
      </div>
    </div>
  );
}
