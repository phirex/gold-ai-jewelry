"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Send, Loader2, Sparkles, MessageCircle } from "lucide-react";
import { useStudio } from "@/contexts/StudioContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface ChatPanelProps {
  className?: string;
  compact?: boolean;
}

export function ChatPanel({ className, compact = false }: ChatPanelProps) {
  const t = useTranslations("studio.chat");
  const { theme } = useTheme();
  const isApple = theme === "minimal";
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    jewelryType,
    gender,
    material,
    description,
    currentDesignId,
    setPriceEstimate,
  } = useStudio();

  const selectedImage = getSelectedImage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

    // Add user message
    addChatMessage({
      role: "user",
      content: userMessage,
    });

    setIsRefining(true);
    resetConversion();

    try {
      // Build refinement prompt
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

      // Add assistant message with the new image
      addChatMessage({
        role: "assistant",
        content: t("refinementComplete"),
        imageUrl: refinedImageUrl,
      });

      // Update variations - put refined image in first slot
      setVariations([refinedImageUrl, variations[1]]);
      selectVariation(0);
      addToHistory(refinedImageUrl);

      // Update the design in database with the REFINED image
      // This ensures admin dashboard shows the latest iteration
      if (currentDesignId && jewelryType && gender) {
        try {
          const saveResponse = await fetch("/api/designs/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              designId: currentDesignId,
              prompt: refinementPrompt, // Updated prompt with refinement
              jewelryType,
              targetGender: gender,
              material: material || "gold_18k",
              thumbnailUrl: refinedImageUrl, // The NEW refined image
              status: "draft",
            }),
          });

          if (saveResponse.ok) {
            const saveData = await saveResponse.json();
            // Update price based on the new refined image
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const hasImage = selectedImage !== null;

  return (
    <div
      className={cn(
        "h-full flex flex-col",
        !compact && (isApple 
          ? "bg-[#FBFBFD] border border-[#E8E8ED] rounded-2xl"
          : "glass-card rounded-2xl"),
        className
      )}
    >
      {/* Header */}
      {!compact && (
        <div className={cn(
          "p-4 border-b",
          isApple ? "border-[#E8E8ED]" : "border-border"
        )}>
          <div className="flex items-center gap-2">
            <MessageCircle className={cn(
              "w-5 h-5",
              isApple ? "text-[#1D1D1F]" : "text-accent-primary"
            )} />
            <h3 className={cn(
              "font-semibold",
              isApple ? "text-[#1D1D1F] tracking-[-0.01em]" : "text-text-primary"
            )}>{t("title")}</h3>
          </div>
          <p className={cn(
            "text-xs mt-1",
            isApple ? "text-[#6E6E73]" : "text-text-tertiary"
          )}>{t("subtitle")}</p>
        </div>
      )}

      {/* Messages */}
      <div className={cn("flex-1 overflow-y-auto", !compact && "p-4")}>
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Sparkles className="w-10 h-10 text-accent-primary/30 mb-3" />
            <p className="text-sm text-text-tertiary">
              {hasImage ? t("emptyStateReady") : t("emptyStateNoImage")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                      ? isApple
                        ? "bg-[#1D1D1F] text-white"
                        : "bg-gradient-to-r from-accent-primary to-accent-secondary text-white"
                      : isApple
                        ? "bg-[#F5F5F7] text-[#1D1D1F]"
                        : "bg-bg-tertiary text-text-primary border border-border"
                  )}
                >
                  <p className={cn("text-sm", isApple && "tracking-[-0.01em]")}>{message.content}</p>
                  {message.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden">
                      <img
                        src={message.imageUrl}
                        alt="Refined design"
                        className="w-full max-w-[200px] h-auto"
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
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Suggestions */}
      {hasImage && chatMessages.length === 0 && (
        <div className={cn("border-t border-border", !compact ? "p-4" : "py-2")}>
          <p className="text-xs text-text-tertiary mb-2">{t("suggestions.title")}</p>
          <div className="flex flex-wrap gap-2">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSend(suggestion.label)}
                disabled={isRefining || !hasImage}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  "bg-bg-tertiary border border-border text-text-secondary",
                  "hover:bg-bg-accent hover:text-accent-primary hover:border-accent-tertiary",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {suggestion.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className={cn(
        "border-t",
        isApple ? "border-[#E8E8ED]" : "border-border",
        !compact ? "p-4" : "pt-2"
      )}>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasImage ? t("placeholder") : t("placeholderNoImage")}
            disabled={!hasImage || isRefining}
            className={cn(
              "flex-1 px-4 py-2.5 transition-all",
              isApple 
                ? cn(
                    "rounded-xl text-[15px] tracking-[-0.01em]",
                    "bg-[#F5F5F7] border border-transparent",
                    "text-[#1D1D1F] placeholder:text-[#86868B]",
                    "focus:outline-none focus:border-[#0071E3] focus:ring-4 focus:ring-[#0071E3]/15",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )
                : cn(
                    "rounded-xl text-sm duration-200",
                    "bg-bg-tertiary border border-border",
                    "text-text-primary placeholder:text-text-tertiary",
                    "focus:outline-none focus:ring-2 focus:ring-accent-primary/30 focus:border-accent-primary",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )
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
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
