"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Heart,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Box,
  Loader2,
  ShoppingCart,
  Check,
  Wand2,
  ArrowLeft,
  X,
} from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { useCart } from "@/contexts/CartContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ModelViewer } from "@/components/design/ModelViewer";
import { HistoryStrip } from "./HistoryStrip";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface PreviewPanelProps {
  isMobile?: boolean;
}

type ViewPhase = "empty" | "selecting" | "working" | "enhanced" | "converting" | "complete";

export function PreviewPanel({ isMobile = false }: PreviewPanelProps) {
  const t = useTranslations("studio");
  const locale = useLocale();
  const router = useRouter();
  const { addItem } = useCart();
  const { theme } = useTheme();
  const isApple = theme === "minimal";

  const {
    variations,
    selectedIndex,
    selectVariation,
    isGenerating,
    imageHistory,
    currentHistoryIndex,
    goBackInHistory,
    goForwardInHistory,
    canGoBack,
    canGoForward,
    toggleFavorite,
    isFavorite,
    modelUrl,
    setModelUrl,
    enhancedImageUrl,
    setEnhancedImageUrl,
    isConverting,
    setIsConverting,
    conversionStep,
    setConversionStep,
    conversionProgress,
    setConversionProgress,
    conversionError,
    setConversionError,
    resetConversion,
    jewelryType,
    gender,
    material,
    description,
    getSelectedImage,
    priceEstimate,
    setVariations,
    addToHistory,
    setIsGenerating,
  } = useStudio();

  const [taskId, setTaskId] = useState<string | null>(null);
  // Track if user has confirmed their selection (moved from selecting to working)
  const [hasConfirmedSelection, setHasConfirmedSelection] = useState(false);

  // Mobile carousel state
  const [mobileCarouselIndex, setMobileCarouselIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Handle swipe gestures for mobile carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50; // minimum swipe distance

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && mobileCarouselIndex < 1) {
        // Swipe left - go to next
        setMobileCarouselIndex(1);
      } else if (diff < 0 && mobileCarouselIndex > 0) {
        // Swipe right - go to previous
        setMobileCarouselIndex(0);
      }
    }
  };

  // Helper to convert relative URLs to absolute URLs
  const toAbsoluteUrl = (url: string): string => {
    if (!url) return url;
    // Already absolute
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Relative URL - prepend origin
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return url;
  };

  // Determine current phase
  const getViewPhase = (): ViewPhase => {
    if (conversionStep === "complete" && modelUrl) return "complete";
    if (conversionStep === "enhanced" && enhancedImageUrl) return "enhanced";
    if (conversionStep === "enhancing" || conversionStep === "converting") return "converting";
    if (conversionStep === "error") return "converting"; // Show error in converting phase
    if (!variations[0] && !variations[1]) return "empty";
    if (!hasConfirmedSelection) return "selecting";
    return "working";
  };

  const viewPhase = getViewPhase();

  // Reset confirmed selection and carousel when new variations are generated
  useEffect(() => {
    if (isGenerating) {
      setHasConfirmedSelection(false);
      setMobileCarouselIndex(0);
    }
  }, [isGenerating]);

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
          setConversionError("3D conversion failed");
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error("Status poll error:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [taskId, modelUrl, conversionStep]);

  const handleSelectAndConfirm = (index: 0 | 1) => {
    selectVariation(index);
    const url = variations[index];
    if (url) {
      addToHistory(url);
      setHasConfirmedSelection(true);
    }
  };

  const handleBackToSelection = () => {
    setHasConfirmedSelection(false);
  };

  // Step 1: Enhance image with Pro quality
  const handleEnhanceImage = async () => {
    const selectedImage = getSelectedImage();
    if (!selectedImage) return;

    setConversionStep("enhancing");
    setIsConverting(true);
    setConversionProgress(0);
    setModelUrl(null);
    setTaskId(null);
    setEnhancedImageUrl(null);
    setConversionError(null);

    // Convert to absolute URL for API calls (needed for server-side fetching)
    const absoluteImageUrl = toAbsoluteUrl(selectedImage);
    console.log("Selected image (absolute):", absoluteImageUrl);

    try {
      console.log("Enhancing image with Nano Banana Pro...");

      const finalizeResponse = await fetch("/api/designs/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImageUrl: absoluteImageUrl,
          originalPrompt: description || "jewelry design",
          jewelryType: jewelryType || "ring",
          targetGender: gender || "unisex",
          material: material,
        }),
      });

      if (finalizeResponse.ok) {
        const finalizeData = await finalizeResponse.json();
        if (finalizeData.imageUrl) {
          setEnhancedImageUrl(finalizeData.imageUrl);
          setConversionStep("enhanced");
          setIsConverting(false);
          console.log("Image enhanced:", finalizeData.imageUrl);
        } else {
          throw new Error("No image URL in response");
        }
      } else {
        const errorData = await finalizeResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Enhancement failed");
      }
    } catch (error) {
      console.error("Enhancement error:", error);
      setConversionStep("error");
      setIsConverting(false);
      setConversionError(error instanceof Error ? error.message : "Enhancement failed");
    }
  };

  // Step 2: Convert enhanced image to 3D (called after user confirms enhanced image)
  const handleStartConversion = async () => {
    const imageForConversion = enhancedImageUrl || getSelectedImage();
    if (!imageForConversion) return;

    setConversionStep("converting");
    setIsConverting(true);
    setConversionProgress(0);

    try {
      console.log("Converting to 3D:", imageForConversion);

      const response = await fetch("/api/designs/convert-to-3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: imageForConversion }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("3D conversion API error:", errorData);
        throw new Error(errorData.error || "Failed to start 3D conversion");
      }

      const data = await response.json();
      console.log("3D conversion started, taskId:", data.taskId);
      setTaskId(data.taskId);
    } catch (error) {
      console.error("Conversion error:", error);
      setConversionStep("error");
      setIsConverting(false);
      setConversionError(error instanceof Error ? error.message : "Conversion failed");
    }
  };

  const handleAddToCart = () => {
    if (!modelUrl) return;

    addItem({
      designId: `design-${Date.now()}`,
      name: `Custom ${jewelryType} for ${gender}`,
      thumbnailUrl: getSelectedImage() || "",
      modelUrl,
      jewelryType: jewelryType || "ring",
      material,
      price: priceEstimate || 0,
    });

    router.push(`/${locale}/checkout`);
  };

  const getStepStatus = () => {
    switch (conversionStep) {
      case "enhancing":
        return { text: t("conversion.enhancing"), subtext: t("conversion.enhancingDesc"), progress: 30 };
      case "converting":
        return { text: t("conversion.converting"), subtext: `${conversionProgress}%`, progress: 30 + conversionProgress * 0.7 };
      case "complete":
        return { text: t("conversion.complete"), subtext: t("conversion.completeDesc"), progress: 100 };
      case "error":
        return { text: t("conversion.error"), subtext: conversionError || t("conversion.errorDesc"), progress: 0 };
      default:
        return null;
    }
  };

  const stepStatus = getStepStatus();
  const selectedImage = getSelectedImage();

  return (
    <div className={cn("h-full flex flex-col gap-3", isMobile && "gap-2")}>
      {/* Main Preview Area */}
      <div className={cn(
        "flex-1 rounded-2xl p-4 overflow-hidden",
        isApple 
          ? "bg-[#FBFBFD] border border-[#E8E8ED]"
          : "glass-card"
      )}>

        {/* PHASE: 3D Model Complete */}
        {viewPhase === "complete" && modelUrl && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Box className="w-4 h-4 text-accent-primary" />
                <span>{t("preview.model3d")}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetConversion}
                className="text-xs"
              >
                {t("backToImage")}
              </Button>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden">
              <ModelViewer
                modelUrl={modelUrl}
                previewImageUrl={enhancedImageUrl || selectedImage}
                className="w-full h-full"
              />
            </div>
            <Button
              variant="gradient"
              size="lg"
              className="mt-3 gap-2"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="w-5 h-5" />
              {t("addToCart")}
            </Button>
          </div>
        )}

        {/* PHASE: Enhanced - Show PRO image before 3D conversion */}
        {viewPhase === "enhanced" && enhancedImageUrl && (
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-accent-primary" />
                <span className="text-accent-primary font-medium">{t("enhanced.title")}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetConversion}
                className="text-xs text-text-secondary"
              >
                {t("backToImage")}
              </Button>
            </div>

            {/* Enhanced image preview */}
            <div className="flex-1 rounded-xl overflow-hidden bg-bg-tertiary">
              <img
                src={enhancedImageUrl}
                alt="Enhanced design"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Actions */}
            <div className="mt-3 space-y-2">
              <p className="text-xs text-text-tertiary text-center">
                {t("enhanced.description")}
              </p>
              <Button
                variant="gradient"
                size="lg"
                className="w-full gap-2"
                onClick={handleStartConversion}
              >
                <Box className="w-5 h-5" />
                {t("enhanced.convertTo3D")}
              </Button>
            </div>
          </div>
        )}

        {/* PHASE: Converting to 3D */}
        {viewPhase === "converting" && (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl animate-pulse" />
              <Loader2 className="w-12 h-12 text-accent-primary animate-spin relative" />
            </div>
            <div className="text-center">
              <p className="text-text-secondary font-medium">{stepStatus?.text}</p>
              <p className="text-sm text-accent-primary mt-1">{stepStatus?.subtext}</p>
            </div>
            <div className="w-48 h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-500"
                style={{ width: `${stepStatus?.progress || 0}%` }}
              />
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={cn(
                "flex items-center gap-1",
                conversionStep === "enhancing" ? "text-accent-primary" : "text-text-tertiary"
              )}>
                {conversionStep !== "enhancing" ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <span>{t("conversion.stepEnhance")}</span>
              </div>
              <ArrowLeft className="w-4 h-4 text-text-tertiary" />
              <div className={cn(
                "flex items-center gap-1",
                conversionStep === "converting" ? "text-accent-primary" : "text-text-tertiary"
              )}>
                {conversionStep === "converting" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Box className="w-4 h-4" />
                )}
                <span>{t("conversion.step3D")}</span>
              </div>
            </div>
            {conversionStep === "error" && (
              <Button
                variant="outline"
                onClick={enhancedImageUrl ? handleStartConversion : handleEnhanceImage}
                className="mt-2"
              >
                {t("tryAgain")}
              </Button>
            )}
          </div>
        )}

        {/* PHASE: Selecting from 2 options */}
        {viewPhase === "selecting" && (
          <div className="h-full flex flex-col">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-text-primary">{t("selection.title")}</h3>
              <p className="text-sm text-text-secondary">{t("selection.subtitle")}</p>
            </div>

            {/* Desktop: Side-by-side grid */}
            {!isMobile && (
              <div className="flex-1 grid grid-cols-2 gap-4">
                {variations.map((url, index) => (
                  <div
                    key={index}
                    className={cn(
                      "relative rounded-xl overflow-hidden transition-all duration-200",
                      "bg-bg-tertiary border-2 cursor-pointer",
                      url ? "hover:border-accent-primary hover:shadow-glow" : "",
                      !url && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={() => url && handleSelectAndConfirm(index as 0 | 1)}
                  >
                    {url ? (
                      <>
                        <img
                          src={url}
                          alt={`Option ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {/* Favorite button */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(url);
                          }}
                          className={cn(
                            "absolute top-2 right-2 p-2 rounded-full transition-all cursor-pointer",
                            isFavorite(url)
                              ? "bg-accent-secondary text-white"
                              : "bg-bg-primary/80 text-text-secondary hover:text-accent-secondary"
                          )}
                        >
                          <Heart className={cn("w-4 h-4", isFavorite(url) && "fill-current")} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-tertiary aspect-square">
                        {isGenerating ? (
                          <Loader2 className="w-8 h-8 animate-spin" />
                        ) : (
                          <span className="text-sm">-</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Mobile: Swipeable carousel */}
            {isMobile && (
              <div className="flex-1 flex flex-col">
                {/* Carousel container */}
                <div
                  ref={carouselRef}
                  className="flex-1 relative overflow-hidden rounded-xl"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="flex h-full transition-transform duration-300 ease-out"
                    style={{ transform: `translateX(-${mobileCarouselIndex * 100}%)` }}
                  >
                    {variations.map((url, index) => (
                      <div
                        key={index}
                        className="w-full h-full flex-shrink-0 relative"
                        onClick={() => url && handleSelectAndConfirm(index as 0 | 1)}
                      >
                        {url ? (
                          <div className="h-full bg-bg-tertiary rounded-xl overflow-hidden border-2 border-transparent active:border-accent-primary transition-colors">
                            <img
                              src={url}
                              alt={`Option ${index + 1}`}
                              className="w-full h-full object-contain"
                            />
                            {/* Favorite button */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(url);
                              }}
                              className={cn(
                                "absolute top-3 right-3 p-2.5 rounded-full transition-all cursor-pointer",
                                isFavorite(url)
                                  ? "bg-accent-secondary text-white"
                                  : "bg-bg-primary/80 text-text-secondary hover:text-accent-secondary"
                              )}
                            >
                              <Heart className={cn("w-5 h-5", isFavorite(url) && "fill-current")} />
                            </div>
                            {/* Tap to select indicator */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-bg-primary/90 backdrop-blur-sm text-sm font-medium text-text-primary shadow-lg">
                              {t("selection.tapToSelect")}
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-text-tertiary bg-bg-tertiary rounded-xl">
                            {isGenerating ? (
                              <Loader2 className="w-10 h-10 animate-spin" />
                            ) : (
                              <span className="text-sm">-</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pagination & Navigation */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  {/* Left arrow */}
                  <button
                    onClick={() => setMobileCarouselIndex(0)}
                    disabled={mobileCarouselIndex === 0}
                    className={cn(
                      "p-2 rounded-full transition-all",
                      mobileCarouselIndex === 0
                        ? "text-text-tertiary"
                        : "text-text-primary bg-bg-tertiary active:bg-bg-accent"
                    )}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Dots */}
                  <div className="flex items-center gap-2">
                    {[0, 1].map((dotIndex) => (
                      <button
                        key={dotIndex}
                        onClick={() => setMobileCarouselIndex(dotIndex)}
                        className={cn(
                          "w-2.5 h-2.5 rounded-full transition-all",
                          mobileCarouselIndex === dotIndex
                            ? "bg-accent-primary w-6"
                            : "bg-text-tertiary/30"
                        )}
                      />
                    ))}
                  </div>

                  {/* Right arrow */}
                  <button
                    onClick={() => setMobileCarouselIndex(1)}
                    disabled={mobileCarouselIndex === 1}
                    className={cn(
                      "p-2 rounded-full transition-all",
                      mobileCarouselIndex === 1
                        ? "text-text-tertiary"
                        : "text-text-primary bg-bg-tertiary active:bg-bg-accent"
                    )}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Option label */}
                <p className="text-center text-sm text-text-secondary mt-2">
                  {t("selection.option")} {mobileCarouselIndex + 1} / 2
                </p>
              </div>
            )}
          </div>
        )}

        {/* PHASE: Working on single image */}
        {viewPhase === "working" && selectedImage && (
          <div className="h-full flex flex-col">
            {/* Header with back button */}
            <div className="flex items-center justify-between mb-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelection}
                className="gap-1.5 text-text-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("backToOptions")}
              </Button>
              <div
                onClick={() => toggleFavorite(selectedImage)}
                className={cn(
                  "p-2 rounded-full transition-all cursor-pointer",
                  isFavorite(selectedImage)
                    ? "bg-accent-secondary text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-accent-secondary"
                )}
              >
                <Heart className={cn("w-4 h-4", isFavorite(selectedImage) && "fill-current")} />
              </div>
            </div>

            {/* Single image preview */}
            <div className="flex-1 rounded-xl overflow-hidden bg-bg-tertiary">
              <img
                src={enhancedImageUrl || selectedImage}
                alt="Your design"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              {/* History Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goBackInHistory}
                  disabled={!canGoBack()}
                  className="p-1.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-text-tertiary">
                  {currentHistoryIndex + 1}/{imageHistory.length || 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goForwardInHistory}
                  disabled={!canGoForward()}
                  className="p-1.5"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Convert to 3D */}
              {!isMobile && (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleEnhanceImage}
                  disabled={isConverting}
                  className="gap-1.5"
                >
                  <Wand2 className="w-4 h-4" />
                  {t("convertTo3D")}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* PHASE: Empty - No image yet */}
        {viewPhase === "empty" && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 rounded-2xl bg-bg-tertiary flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-accent-primary/50" />
            </div>
            <h3 className="font-semibold text-text-primary mb-2">{t("emptyState.title")}</h3>
            <p className="text-sm text-text-secondary max-w-xs">
              {t("emptyState.description")}
            </p>
          </div>
        )}
      </div>

      {/* History Strip - only in working phase */}
      {viewPhase === "working" && imageHistory.length > 1 && (
        <HistoryStrip />
      )}

      {/* Mobile: Convert to 3D Button */}
      {isMobile && viewPhase === "working" && (
        <Button
          variant="gradient"
          size="lg"
          onClick={handleEnhanceImage}
          disabled={!selectedImage || isConverting}
          className="gap-2"
        >
          <Wand2 className="w-5 h-5" />
          {t("convertTo3D")}
        </Button>
      )}
    </div>
  );
}
