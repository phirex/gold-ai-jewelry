"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ShoppingCart,
  Save,
  RotateCcw,
  Image as ImageIcon,
  Box,
  ArrowRight,
  Heart,
  Check,
  Sparkles,
  Wand2,
} from "lucide-react";
import { useDesignWizard } from "@/contexts/DesignWizardContext";
import { useCart } from "@/contexts/CartContext";
import { ModelViewer } from "@/components/design/ModelViewer";
import { MaterialSelector } from "@/components/design/MaterialSelector";
import { PriceDisplay } from "@/components/design/PriceDisplay";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type ConversionStep = "idle" | "enhancing" | "converting" | "complete" | "error";

export function FinalReviewStep() {
  const t = useTranslations("design.wizard.review");
  const tActions = useTranslations("design.actions");
  const locale = useLocale();
  const router = useRouter();
  const { addItem } = useCart();

  const {
    selectedImageUrl,
    modelUrl,
    setModelUrl,
    isConverting,
    setIsConverting,
    conversionProgress,
    setConversionProgress,
    material,
    setMaterial,
    priceBreakdown,
    setPriceBreakdown,
    jewelryType,
    gender,
    description,
    reset,
    favorites,
    selectFavoriteForReview,
  } = useDesignWizard();

  const [taskId, setTaskId] = useState<string | null>(null);
  const [conversionStep, setConversionStep] = useState<ConversionStep>("idle");
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll for 3D conversion status
  useEffect(() => {
    if (!taskId || modelUrl || conversionStep !== "converting") return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/designs/status?taskId=${taskId}`);
        const data = await response.json();

        if (data.progress) {
          setConversionProgress(data.progress);
        }

        if (data.status === "success" && data.modelUrl) {
          setModelUrl(data.modelUrl);
          setIsConverting(false);
          setConversionStep("complete");
          clearInterval(pollInterval);
        } else if (data.status === "failed") {
          setIsConverting(false);
          setConversionStep("error");
          setErrorMessage("3D conversion failed");
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Status poll error:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [taskId, modelUrl, conversionStep]);

  // Main conversion flow - triggered by button click
  const handleStartConversion = async () => {
    if (!selectedImageUrl) return;

    setConversionStep("enhancing");
    setIsConverting(true);
    setConversionProgress(0);
    setModelUrl(null);
    setTaskId(null);
    setEnhancedImageUrl(null);
    setErrorMessage(null);

    try {
      // Step 1: Enhance image with Pro quality
      console.log("Step 1: Enhancing image with Nano Banana Pro...");

      const finalizeResponse = await fetch("/api/designs/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImageUrl: selectedImageUrl,
          originalPrompt: description || "jewelry design",
          jewelryType: jewelryType || "ring",
          targetGender: gender || "unisex",
          material: material,
        }),
      });

      let imageForConversion = selectedImageUrl;

      if (finalizeResponse.ok) {
        const finalizeData = await finalizeResponse.json();
        if (finalizeData.imageUrl) {
          imageForConversion = finalizeData.imageUrl;
          setEnhancedImageUrl(finalizeData.imageUrl);
          console.log("Image enhanced:", finalizeData.imageUrl);
        }
      } else {
        console.warn("Enhancement failed, using original image");
      }

      // Step 2: Convert to 3D
      setConversionStep("converting");
      console.log("Step 2: Converting to 3D...");

      const response = await fetch("/api/designs/convert-to-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageForConversion }),
      });

      if (!response.ok) {
        throw new Error("Failed to start 3D conversion");
      }

      const data = await response.json();
      setTaskId(data.taskId);
      // Polling will handle the rest via useEffect
    } catch (error) {
      console.error("Conversion error:", error);
      setConversionStep("error");
      setIsConverting(false);
      setErrorMessage(error instanceof Error ? error.message : "Conversion failed");
    }
  };

  const handleSelectFavorite = (url: string) => {
    if (url !== selectedImageUrl) {
      selectFavoriteForReview(url);
      // Reset conversion state when selecting a new image
      setModelUrl(null);
      setTaskId(null);
      setConversionStep("idle");
      setEnhancedImageUrl(null);
      setErrorMessage(null);
    }
  };

  const handleMaterialChange = (newMaterial: typeof material) => {
    setMaterial(newMaterial);

    if (priceBreakdown) {
      const materialMultipliers: Record<string, number> = {
        gold_14k: 0.8,
        gold_18k: 1.0,
        gold_24k: 1.3,
        silver: 0.3,
        platinum: 1.5,
      };

      const baseMaterialCost = 2500;
      const newMaterialCost = baseMaterialCost * (materialMultipliers[newMaterial] || 1);

      setPriceBreakdown({
        ...priceBreakdown,
        materials: newMaterialCost,
        total: newMaterialCost + priceBreakdown.stones + priceBreakdown.labor,
      });
    }
  };

  const handleProceedToCheckout = () => {
    if (!modelUrl || !priceBreakdown) return;

    addItem({
      designId: `design-${Date.now()}`,
      name: `Custom ${jewelryType} for ${gender}`,
      thumbnailUrl: selectedImageUrl || "",
      modelUrl,
      jewelryType: jewelryType || "ring",
      material,
      price: priceBreakdown.total,
    });

    router.push(`/${locale}/checkout`);
  };

  const handleStartOver = () => {
    reset();
  };

  const getStepStatus = () => {
    switch (conversionStep) {
      case "enhancing":
        return { text: "Enhancing image quality...", subtext: "Using Pro model for best 3D results", progress: 30 };
      case "converting":
        return { text: "Converting to 3D...", subtext: `${conversionProgress}% complete`, progress: 30 + (conversionProgress * 0.7) };
      case "complete":
        return { text: "Complete!", subtext: "Your 3D model is ready", progress: 100 };
      case "error":
        return { text: "Error", subtext: errorMessage || "Something went wrong", progress: 0 };
      default:
        return null;
    }
  };

  const stepStatus = getStepStatus();

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient">
          {t("title")}
        </h2>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>

      {/* Favorites Gallery - Show if there are favorites */}
      {favorites.length > 0 && (
        <div className="glass-card rounded-2xl p-5 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-accent-secondary" />
            <h3 className="font-semibold text-text-primary">Choose Your Final Design</h3>
            <span className="text-sm text-text-tertiary">({favorites.length} favorites)</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {favorites.map((url, index) => (
              <button
                key={index}
                onClick={() => handleSelectFavorite(url)}
                disabled={conversionStep !== "idle" && conversionStep !== "complete" && conversionStep !== "error"}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg",
                  url === selectedImageUrl
                    ? "ring-3 ring-accent-primary ring-offset-2 ring-offset-bg-primary shadow-glow"
                    : "opacity-70 hover:opacity-100",
                  (conversionStep !== "idle" && conversionStep !== "complete" && conversionStep !== "error") && "cursor-not-allowed"
                )}
              >
                <img
                  src={url}
                  alt={`Favorite design ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {url === selectedImageUrl && (
                  <div className="absolute inset-0 bg-accent-primary/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-accent-primary flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Left: 2D Reference Image */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <ImageIcon className="w-4 h-4 text-accent-primary" />
            <span>{t("referenceImage")}</span>
            {enhancedImageUrl && (
              <span className="text-xs bg-accent-primary/20 text-accent-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Enhanced
              </span>
            )}
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden border border-border bg-bg-secondary shadow-medium">
            {selectedImageUrl ? (
              <img
                src={enhancedImageUrl || selectedImageUrl}
                alt="Selected design"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                {t("noImage")}
              </div>
            )}
          </div>
        </div>

        {/* Right: 3D Model or Action */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Box className="w-4 h-4 text-accent-primary" />
            <span>{t("model3d")}</span>
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden border border-border bg-bg-secondary shadow-medium">
            {conversionStep === "idle" ? (
              // Show "Create 3D" button
              <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-6">
                <div className="text-center space-y-2">
                  <Wand2 className="w-12 h-12 text-accent-primary mx-auto mb-4" />
                  <h3 className="font-semibold text-text-primary">Ready to Create 3D Model</h3>
                  <p className="text-sm text-text-secondary">
                    We&apos;ll enhance your image with Pro quality, then convert it to an interactive 3D model.
                  </p>
                </div>
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleStartConversion}
                  disabled={!selectedImageUrl}
                  className="gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Enhance & Create 3D
                </Button>
              </div>
            ) : conversionStep === "enhancing" || conversionStep === "converting" ? (
              // Show progress
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-bg-secondary">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="w-12 h-12 text-accent-primary animate-spin relative" />
                </div>
                <div className="text-center">
                  <p className="text-text-secondary font-medium">{stepStatus?.text}</p>
                  <p className="text-sm text-accent-primary mt-1">{stepStatus?.subtext}</p>
                </div>
                {/* Progress bar */}
                <div className="w-48 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500"
                    style={{ width: `${stepStatus?.progress || 0}%` }}
                  />
                </div>
                {/* Steps indicator */}
                <div className="flex items-center gap-3 text-sm">
                  <div className={cn(
                    "flex items-center gap-1",
                    conversionStep === "enhancing" ? "text-accent-primary" : "text-text-tertiary"
                  )}>
                    {conversionStep === "converting" ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <span>Enhance</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-tertiary" />
                  <div className={cn(
                    "flex items-center gap-1",
                    conversionStep === "converting" ? "text-accent-primary" : "text-text-tertiary"
                  )}>
                    {conversionStep === "converting" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Box className="w-4 h-4" />
                    )}
                    <span>3D Model</span>
                  </div>
                </div>
              </div>
            ) : conversionStep === "complete" && modelUrl ? (
              // Show 3D model
              <ModelViewer
                modelUrl={modelUrl}
                previewImageUrl={enhancedImageUrl || selectedImageUrl}
                className="w-full h-full"
              />
            ) : conversionStep === "error" ? (
              // Show error with retry
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <h3 className="font-semibold text-text-primary">Something went wrong</h3>
                  <p className="text-sm text-text-secondary">{errorMessage}</p>
                </div>
                <Button variant="outline" onClick={handleStartConversion}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                {t("waitingForConversion")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Material, Price, Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {/* Material Selector */}
        <div className="glass-card rounded-2xl p-5">
          <MaterialSelector value={material} onChange={handleMaterialChange} />
        </div>

        {/* Price Display */}
        <div className="glass-card rounded-2xl p-5">
          <PriceDisplay breakdown={priceBreakdown} isLoading={false} />
        </div>

        {/* Actions */}
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <Button
            variant="gradient"
            className="w-full gap-2"
            onClick={handleProceedToCheckout}
            disabled={!modelUrl}
          >
            <ShoppingCart className="w-4 h-4" />
            {t("proceedToCheckout")}
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button variant="outline" className="w-full gap-2" disabled={!modelUrl}>
            <Save className="w-4 h-4" />
            {tActions("saveDesign")}
          </Button>

          <Button variant="ghost" className="w-full gap-2" onClick={handleStartOver}>
            <RotateCcw className="w-4 h-4" />
            {tActions("startOver")}
          </Button>
        </div>
      </div>
    </div>
  );
}
