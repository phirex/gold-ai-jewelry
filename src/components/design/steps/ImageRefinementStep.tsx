"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw, Check, Sparkles, Send, MessageSquare, DollarSign } from "lucide-react";
import { useDesignWizard } from "@/contexts/DesignWizardContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ImageRefinementStep() {
  const t = useTranslations("design.wizard.refine");
  const tChat = useTranslations("design.chat");
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
    priceBreakdown,
    setPriceBreakdown,
    chatSessionId,
  } = useDesignWizard();

  const [currentPrompt, setCurrentPrompt] = useState(constructPrompt());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Generate initial variations on mount
  useEffect(() => {
    if (variations.length === 0 && !isGenerating) {
      generateVariations(currentPrompt);
    }
  }, []);

  // Estimate price based on description
  useEffect(() => {
    if (!priceBreakdown) {
      estimatePrice();
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
          count: 4,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate variations");

      const data = await response.json();
      setVariations(data.images);
      setCurrentPrompt(prompt);
    } catch (error) {
      console.error("Error generating variations:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const estimatePrice = async () => {
    // Base price estimation
    const materialMultipliers: Record<string, number> = {
      gold_14k: 0.8,
      gold_18k: 1.0,
      gold_24k: 1.3,
      silver: 0.3,
      platinum: 1.5,
    };

    const baseMaterialCost = 2500;
    const materialCost = baseMaterialCost * (materialMultipliers[material] || 1);
    const stonesCost = 1500;
    const laborCost = 800;

    setPriceBreakdown({
      materials: materialCost,
      stones: stonesCost,
      labor: laborCost,
      total: materialCost + stonesCost + laborCost,
    });
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isSendingChat) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsSendingChat(true);

    try {
      const response = await fetch("/api/chat/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          sessionId: chatSessionId,
          context: {
            jewelryType,
            gender,
            material,
            currentPrompt,
          },
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.message }]);

      // If Claude suggests regenerating
      if (data.shouldRegenerate && data.newPrompt) {
        generateVariations(data.newPrompt);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: tChat("errorMessage") },
      ]);
    } finally {
      setIsSendingChat(false);
    }
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient-gold-bright">
          {t("title")}
        </h2>
        <p className="text-dark-400">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Image Grid */}
        <div className="lg:col-span-2 space-y-4">
          {/* Image Grid - Always show 4 slots */}
          <div className="grid grid-cols-2 gap-4">
            {Array(4).fill(null).map((_, index) => {
              const imageUrl = variations[index];
              const isLoading = isGenerating && !imageUrl;

              return (
                <button
                  key={index}
                  onClick={() => imageUrl && !isGenerating && setSelectedImageUrl(imageUrl)}
                  disabled={!imageUrl || isGenerating}
                  className={cn(
                    "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all",
                    "bg-dark-800",
                    imageUrl && selectedImageUrl === imageUrl
                      ? "border-gold-500 ring-4 ring-gold-500/20 shadow-lg shadow-gold-500/20"
                      : imageUrl
                      ? "border-dark-700 hover:border-gold-500/50"
                      : "border-dark-700",
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
                        <div className="absolute top-3 right-3 w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center animate-scale-in">
                          <Check className="w-5 h-5 text-dark-900" />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="relative">
                            <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-lg animate-pulse" />
                            <Loader2 className="w-8 h-8 text-gold-400 animate-spin relative" />
                          </div>
                          <span className="text-xs text-dark-500">{t("generating")}</span>
                        </>
                      ) : (
                        <span className="text-dark-600 text-sm">#{index + 1}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selection hint */}
          {variations.length > 0 && !selectedImageUrl && !isGenerating && (
            <p className="text-center text-dark-400 text-sm animate-pulse">
              {t("selectOne")}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => generateVariations(currentPrompt)}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              {t("showVariations")}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowChat(!showChat)}
              className="gap-2 lg:hidden"
            >
              <MessageSquare className="w-4 h-4" />
              {showChat ? tChat("hide") : tChat("show")}
            </Button>
          </div>
        </div>

        {/* Right: Chat + Price */}
        <div className="space-y-4">
          {/* Price Estimate */}
          {priceBreakdown && (
            <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-gold-400" />
                <h3 className="font-semibold text-dark-100">{t("estimatedPrice")}</h3>
              </div>
              <div className="text-2xl font-bold text-gradient-gold-bright">
                {formatPrice(priceBreakdown.total)}
              </div>
              <p className="text-xs text-dark-500 mt-1">{t("priceNote")}</p>
            </div>
          )}

          {/* Chat Panel */}
          <div
            className={cn(
              "bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden animate-fade-in-up",
              "flex flex-col",
              showChat || "hidden lg:flex",
              "h-[350px]"
            )}
          >
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-dark-700 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-400" />
              <span className="text-sm font-medium text-dark-200">{tChat("title")}</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-dark-500 text-center">
                    {tChat("emptyState")}
                  </p>
                </div>
              ) : (
                chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "max-w-[85%] p-3 rounded-xl text-sm",
                      msg.role === "user"
                        ? "bg-gold-500/10 border border-gold-500/30 text-dark-100 ml-auto"
                        : "bg-dark-700 text-dark-200"
                    )}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              {isSendingChat && (
                <div className="bg-dark-700 p-3 rounded-xl max-w-[85%]">
                  <Loader2 className="w-4 h-4 text-dark-400 animate-spin" />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-dark-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                  placeholder={t("chatPlaceholder")}
                  className="flex-1 px-4 py-2 rounded-xl bg-dark-700 border border-dark-600 text-dark-100 placeholder:text-dark-500 text-sm focus:outline-none focus:border-gold-500/50"
                  disabled={isSendingChat}
                />
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() || isSendingChat}
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-dark-500">{tChat("suggestions.title")}</p>
            <div className="flex flex-wrap gap-2">
              {[
                tChat("suggestions.thinner"),
                tChat("suggestions.addDiamonds"),
                tChat("suggestions.moreDetails"),
                tChat("suggestions.simpler"),
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setChatInput(suggestion)}
                  className="px-3 py-1.5 text-xs bg-dark-700 text-dark-300 rounded-full hover:bg-dark-600 hover:text-gold-400 transition-all border border-dark-600 hover:border-gold-500/50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
