"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart, Save, RotateCcw, Check, Image as ImageIcon, Box } from "lucide-react";
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
  } = useDesignWizard();

  const [taskId, setTaskId] = useState<string | null>(null);
  const [addedToCart, setAddedToCart] = useState(false);

  // Start 3D conversion on mount
  useEffect(() => {
    if (selectedImageUrl && !modelUrl && !isConverting && !taskId) {
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

  const handleMaterialChange = (newMaterial: typeof material) => {
    setMaterial(newMaterial);

    // Update price based on material
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

  const handleAddToCart = () => {
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

    setAddedToCart(true);

    // Navigate to checkout after short delay
    setTimeout(() => {
      router.push(`/${locale}/checkout`);
    }, 1500);
  };

  const handleStartOver = () => {
    reset();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient-gold-bright">
          {t("title")}
        </h2>
        <p className="text-dark-400">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: 2D Reference Image */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <ImageIcon className="w-4 h-4 text-gold-400" />
            <span>{t("referenceImage")}</span>
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden border border-dark-700 bg-dark-800">
            {selectedImageUrl ? (
              <img
                src={selectedImageUrl}
                alt="Selected design"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-dark-500">
                {t("noImage")}
              </div>
            )}
          </div>
        </div>

        {/* Right: 3D Model */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-dark-400">
            <Box className="w-4 h-4 text-gold-400" />
            <span>{t("model3d")}</span>
          </div>
          <div className="aspect-square rounded-2xl overflow-hidden border border-dark-700 bg-dark-800">
            {isConverting ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="w-12 h-12 text-gold-400 animate-spin relative" />
                </div>
                <div className="text-center">
                  <p className="text-dark-300">{t("converting")}</p>
                  {conversionProgress > 0 && (
                    <p className="text-sm text-gold-400 mt-1">
                      {t("conversionProgress", { progress: conversionProgress })}
                    </p>
                  )}
                </div>
                {/* Progress bar */}
                <div className="w-48 h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gold-500 to-gold-400 transition-all duration-300"
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
              <div className="w-full h-full flex items-center justify-center text-dark-500">
                {t("waitingForConversion")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Material, Price, Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material Selector */}
        <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700">
          <MaterialSelector value={material} onChange={handleMaterialChange} />
        </div>

        {/* Price Display */}
        <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700">
          <PriceDisplay breakdown={priceBreakdown} isLoading={false} />
        </div>

        {/* Actions */}
        <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 space-y-3">
          <Button
            variant="gradient"
            className="w-full gap-2"
            onClick={handleAddToCart}
            disabled={!modelUrl || addedToCart}
          >
            {addedToCart ? (
              <>
                <Check className="w-4 h-4" />
                {t("addedToCart")}
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                {tActions("addToCart")}
              </>
            )}
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
