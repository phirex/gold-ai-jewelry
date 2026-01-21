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
} from "lucide-react";
import { useDesignWizard } from "@/contexts/DesignWizardContext";
import { useCart } from "@/contexts/CartContext";
import { ModelViewer } from "@/components/design/ModelViewer";
import { MaterialSelector } from "@/components/design/MaterialSelector";
import { PriceDisplay } from "@/components/design/PriceDisplay";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function FinalReviewStep() {
  const t = useTranslations("design.wizard.review");
  const tActions = useTranslations("design.actions");
  const locale = useLocale();
  const router = useRouter();
  const { addItem } = useCart();

  const {
    selectedImageUrl,
    setSelectedImageUrl,
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
  const [selectedForConversion, setSelectedForConversion] = useState<string | null>(null);

  // Start 3D conversion when an image is selected
  useEffect(() => {
    if (selectedImageUrl && !modelUrl && !isConverting && !taskId) {
      setSelectedForConversion(selectedImageUrl);
      startConversion();
    }
  }, [selectedImageUrl]);

  // Poll for conversion status
  useEffect(() => {
    if (!taskId || modelUrl) return;

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
          clearInterval(pollInterval);
        } else if (data.status === "failed") {
          setIsConverting(false);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Status poll error:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [taskId, modelUrl]);

  const startConversion = async () => {
    if (!selectedImageUrl) return;

    setIsConverting(true);
    setConversionProgress(0);
    setModelUrl(null);
    setTaskId(null);

    try {
      const response = await fetch("/api/designs/convert-to-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: selectedImageUrl }),
      });

      if (!response.ok) throw new Error("Failed to start conversion");

      const data = await response.json();
      setTaskId(data.taskId);
    } catch (error) {
      console.error("Conversion error:", error);
      setIsConverting(false);
    }
  };

  const handleSelectFavorite = (url: string) => {
    if (url !== selectedImageUrl) {
      selectFavoriteForReview(url);
      setModelUrl(null);
      setTaskId(null);
      setSelectedForConversion(url);
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
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg",
                  url === selectedImageUrl
                    ? "ring-3 ring-accent-primary ring-offset-2 ring-offset-bg-primary shadow-glow"
                    : "opacity-70 hover:opacity-100"
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
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden border border-border bg-bg-secondary shadow-medium">
            {selectedImageUrl ? (
              <img
                src={selectedImageUrl}
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

        {/* Right: 3D Model */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Box className="w-4 h-4 text-accent-primary" />
            <span>{t("model3d")}</span>
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden border border-border bg-bg-secondary shadow-medium">
            {isConverting ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-bg-secondary">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="w-12 h-12 text-accent-primary animate-spin relative" />
                </div>
                <div className="text-center">
                  <p className="text-text-secondary">{t("converting")}</p>
                  {conversionProgress > 0 && (
                    <p className="text-sm text-accent-primary mt-1">
                      {t("conversionProgress", { progress: conversionProgress })}
                    </p>
                  )}
                </div>
                {/* Progress bar */}
                <div className="w-48 h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-300"
                    style={{ width: `${conversionProgress}%` }}
                  />
                </div>
              </div>
            ) : modelUrl ? (
              <ModelViewer
                modelUrl={modelUrl}
                previewImageUrl={selectedImageUrl}
                className="w-full h-full"
              />
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
