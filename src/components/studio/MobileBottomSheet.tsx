"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { ChevronUp, ChevronDown, Sparkles, Loader2, MessageCircle, Settings2 } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

type SheetState = "collapsed" | "partial" | "expanded";

export function MobileBottomSheet() {
  const t = useTranslations("studio");
  const tWizard = useTranslations("design.wizard");

  const [sheetState, setSheetState] = useState<SheetState>("partial");
  const [activeTab, setActiveTab] = useState<"controls" | "chat">("controls");
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

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
    variations,
    getSelectedImage,
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

      // Collapse sheet after generating
      setSheetState("collapsed");
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Touch handlers for dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const deltaY = currentY - startY;
    const threshold = 50;

    if (deltaY < -threshold) {
      // Swiped up
      if (sheetState === "collapsed") setSheetState("partial");
      else if (sheetState === "partial") setSheetState("expanded");
    } else if (deltaY > threshold) {
      // Swiped down
      if (sheetState === "expanded") setSheetState("partial");
      else if (sheetState === "partial") setSheetState("collapsed");
    }
  };

  const toggleSheet = () => {
    if (sheetState === "collapsed") setSheetState("partial");
    else if (sheetState === "partial") setSheetState("expanded");
    else setSheetState("partial");
  };

  const getSheetHeight = () => {
    switch (sheetState) {
      case "collapsed":
        return "h-16";
      case "partial":
        return "h-[45vh]";
      case "expanded":
        return "h-[80vh]";
      default:
        return "h-[45vh]";
    }
  };

  const hasImage = getSelectedImage() !== null;

  return (
    <div
      ref={sheetRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "glass-card rounded-t-3xl shadow-2xl",
        "transition-all duration-300 ease-out",
        getSheetHeight()
      )}
    >
      {/* Handle */}
      <div
        className="py-3 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={toggleSheet}
      >
        <div className="w-12 h-1.5 bg-text-tertiary/30 rounded-full mx-auto" />
      </div>

      {/* Collapsed view */}
      {sheetState === "collapsed" && (
        <div className="px-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="gradient"
              size="sm"
              onClick={handleGenerate}
              disabled={!canGenerate() || isGenerating}
              className="gap-1.5"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {t("generate")}
            </Button>
            {hasImage && (
              <span className="text-xs text-text-tertiary">{t("tapToRefine")}</span>
            )}
          </div>
          <ChevronUp className="w-5 h-5 text-text-tertiary" />
        </div>
      )}

      {/* Partial/Expanded view */}
      {sheetState !== "collapsed" && (
        <div className="flex flex-col h-[calc(100%-40px)]">
          {/* Tab Switcher */}
          <div className="flex border-b border-border px-4">
            <button
              onClick={() => setActiveTab("controls")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeTab === "controls"
                  ? "text-accent-primary"
                  : "text-text-tertiary"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Settings2 className="w-4 h-4" />
                {t("tabs.controls")}
              </div>
              {activeTab === "controls" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeTab === "chat"
                  ? "text-accent-primary"
                  : "text-text-tertiary"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />
                {t("tabs.refine")}
              </div>
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary" />
              )}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "controls" ? (
              <div className="space-y-4">
                {/* Description - Primary input at top */}
                <div className="space-y-2">
                  <label className="text-base font-semibold text-text-primary">
                    {t("controls.description")}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("controls.descriptionPlaceholder")}
                    rows={5}
                    className={cn(
                      "w-full px-4 py-4 rounded-2xl resize-none text-base",
                      "bg-bg-tertiary border-2 border-border",
                      "text-text-primary placeholder:text-text-tertiary",
                      "focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary/50"
                    )}
                  />
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Gender */}
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
                          "flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all",
                          gender === option.value
                            ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white"
                            : "bg-bg-tertiary text-text-secondary border border-border"
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">
                    {t("controls.type")}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {jewelryTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setJewelryType(type.value)}
                        className={cn(
                          "py-2 px-4 rounded-xl text-sm font-medium transition-all",
                          jewelryType === type.value
                            ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white"
                            : "bg-bg-tertiary text-text-secondary border border-border"
                        )}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Material */}
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
                          "py-2 px-4 rounded-xl text-sm font-medium transition-all",
                          material === mat.value
                            ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white"
                            : "bg-bg-tertiary text-text-secondary border border-border"
                        )}
                      >
                        {mat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full gap-2"
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
              </div>
            ) : (
              /* Chat Tab */
              <MobileChatContent />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Inline chat component for mobile
function MobileChatContent() {
  const t = useTranslations("studio.chat");
  const [input, setInput] = useState("");

  const {
    chatMessages,
    addChatMessage,
    isRefining,
    setIsRefining,
    getSelectedImage,
    variations,
    setVariations,
    selectVariation,
    addToHistory,
    resetConversion,
    description,
    jewelryType,
    gender,
    material,
    currentDesignId,
    setPriceEstimate,
  } = useStudio();

  const selectedImage = getSelectedImage();
  const hasImage = selectedImage !== null;

  const quickSuggestions = [
    { id: "thinner", label: t("suggestions.thinner") },
    { id: "diamonds", label: t("suggestions.addDiamonds") },
    { id: "details", label: t("suggestions.moreDetails") },
    { id: "simpler", label: t("suggestions.simpler") },
  ];

  const handleSend = async (message: string) => {
    if (!message.trim() || !selectedImage || isRefining) return;

    const userMessage = message.trim();
    setInput("");

    addChatMessage({
      role: "user",
      content: userMessage,
    });

    setIsRefining(true);
    resetConversion();

    try {
      const refinementPrompt = `${description}. Modification: ${userMessage}`;

      const response = await fetch("/api/designs/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImageUrl: selectedImage,
          refinementPrompt,
        }),
      });

      if (!response.ok) throw new Error("Refinement failed");

      const data = await response.json();
      const refinedImageUrl = data.imageUrl;

      addChatMessage({
        role: "assistant",
        content: t("refinementComplete"),
        imageUrl: refinedImageUrl,
      });

      setVariations([refinedImageUrl, variations[1]]);
      selectVariation(0);
      addToHistory(refinedImageUrl);

      // Update the design in database with the REFINED image
      if (currentDesignId && jewelryType && gender) {
        try {
          const saveResponse = await fetch("/api/designs/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              designId: currentDesignId,
              prompt: refinementPrompt,
              jewelryType,
              targetGender: gender,
              material: material || "gold_18k",
              thumbnailUrl: refinedImageUrl,
              status: "draft",
            }),
          });

          if (saveResponse.ok) {
            const saveData = await saveResponse.json();
            if (saveData.pricing?.estimatedPrice) {
              setPriceEstimate(saveData.pricing.estimatedPrice);
            }
          }
        } catch (saveError) {
          console.error("Failed to update design with refined image:", saveError);
        }
      }
    } catch (error) {
      console.error("Refinement error:", error);
      addChatMessage({
        role: "assistant",
        content: t("refinementError"),
      });
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Suggestions */}
      {hasImage && chatMessages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-text-tertiary">{t("suggestions.title")}</p>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSend(suggestion.label)}
                disabled={isRefining || !hasImage}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  "bg-bg-tertiary border border-border text-text-secondary",
                  "hover:bg-bg-accent hover:text-accent-primary"
                )}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {chatMessages.length > 0 && (
        <div className="space-y-3">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5",
                  message.role === "user"
                    ? "bg-gradient-to-r from-accent-primary to-accent-secondary text-white"
                    : "bg-bg-tertiary text-text-primary border border-border"
                )}
              >
                <p className="text-sm">{message.content}</p>
                {message.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden">
                    <img
                      src={message.imageUrl}
                      alt="Refined design"
                      className="w-full max-w-[150px] h-auto"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {isRefining && (
            <div className="flex justify-start">
              <div className="bg-bg-tertiary rounded-2xl px-4 py-3 border border-border">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{t("refining")}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-2 sticky bottom-0 pt-2 bg-bg-primary">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(input);
            }
          }}
          placeholder={hasImage ? t("placeholder") : t("placeholderNoImage")}
          disabled={!hasImage || isRefining}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl",
            "bg-bg-tertiary border border-border",
            "text-text-primary placeholder:text-text-tertiary text-sm",
            "focus:outline-none focus:ring-2 focus:ring-accent-primary/30"
          )}
        />
        <Button
          variant="gradient"
          size="sm"
          onClick={() => handleSend(input)}
          disabled={!input.trim() || !hasImage || isRefining}
          className="p-2.5"
        >
          {isRefining ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Empty state */}
      {!hasImage && chatMessages.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-text-tertiary">{t("emptyStateNoImage")}</p>
        </div>
      )}
    </div>
  );
}
