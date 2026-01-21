"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Loader2,
  Sparkles,
  Send,
  RefreshCw,
  Heart,
  ChevronLeft,
  ChevronRight,
  History,
  Star,
} from "lucide-react";
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
  const locale = useLocale();
  const {
    selectedImageUrl,
    setSelectedImageUrl,
    constructPrompt,
    jewelryType,
    gender,
    material,
    priceBreakdown,
    setPriceBreakdown,
    chatSessionId,
    // New: History & Favorites
    imageHistory,
    currentHistoryIndex,
    favorites,
    addToHistory,
    goBackInHistory,
    goForwardInHistory,
    goToHistoryIndex,
    toggleFavorite,
    isFavorite,
    canGoBack,
    canGoForward,
  } = useDesignWizard();

  const [currentPrompt] = useState(constructPrompt());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

  // Add initial image to history when entering step
  useEffect(() => {
    if (selectedImageUrl && imageHistory.length === 0) {
      addToHistory(selectedImageUrl);
    }
  }, []);

  // Estimate price on mount
  useEffect(() => {
    if (!priceBreakdown) {
      estimatePrice();
    }
  }, []);

  const estimatePrice = async () => {
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

  const refineImage = async (refinementPrompt: string) => {
    if (!selectedImageUrl) return;

    setIsRefining(true);
    try {
      const response = await fetch("/api/designs/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceImageUrl: selectedImageUrl,
          refinementPrompt,
          strength: 0.65,
        }),
      });

      if (!response.ok) throw new Error("Refinement failed");

      const data = await response.json();
      if (data.imageUrl) {
        // Add to history instead of just setting
        addToHistory(data.imageUrl);
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: t("imageUpdated") },
        ]);
      }
    } catch (error) {
      console.error("Refinement error:", error);
      setChatMessages((prev) => [
        ...prev,
        { role: "assistant", content: tChat("errorMessage") },
      ]);
    } finally {
      setIsRefining(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim() || isSendingChat || isRefining) return;

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
            jewelryType: jewelryType || "ring",
            gender: gender || "unisex",
            material,
            currentPrompt,
            locale: locale as "en" | "he",
          },
        }),
      });

      if (!response.ok) throw new Error("Chat failed");

      const data = await response.json();
      setChatMessages((prev) => [...prev, { role: "assistant", content: data.message }]);

      if (data.shouldRegenerate && data.newPrompt) {
        setIsSendingChat(false);
        await refineImage(data.newPrompt);
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

  const isCurrentImageFavorite = selectedImageUrl ? isFavorite(selectedImageUrl) : false;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gradient">
          {t("title")}
        </h2>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Left: Selected Image with History Controls */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-accent-primary/30 bg-bg-secondary shadow-medium">
            {isRefining ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-bg-secondary">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-primary/20 rounded-full blur-xl animate-pulse scale-150" />
                  <RefreshCw className="w-12 h-12 text-accent-primary animate-spin relative" />
                </div>
                <span className="text-sm text-accent-primary mt-4">{t("refiningImage")}</span>
                <span className="text-xs text-text-tertiary mt-1">{t("pleaseWait")}</span>
              </div>
            ) : (
              selectedImageUrl && (
                <img
                  src={selectedImageUrl}
                  alt="Selected design"
                  className="w-full h-full object-cover"
                />
              )
            )}

            {/* Overlay controls */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
              <div className="flex items-center justify-between">
                {/* History navigation */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={goBackInHistory}
                    disabled={!canGoBack() || isRefining}
                    className={cn(
                      "p-2 rounded-xl bg-white/20 backdrop-blur-sm transition-all",
                      canGoBack() && !isRefining
                        ? "hover:bg-white/30 text-white"
                        : "opacity-50 cursor-not-allowed text-white/50"
                    )}
                    title="Go back"
                  >
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <span className="text-white/80 text-sm font-medium px-2">
                    {currentHistoryIndex + 1} / {imageHistory.length}
                  </span>
                  <button
                    onClick={goForwardInHistory}
                    disabled={!canGoForward() || isRefining}
                    className={cn(
                      "p-2 rounded-xl bg-white/20 backdrop-blur-sm transition-all",
                      canGoForward() && !isRefining
                        ? "hover:bg-white/30 text-white"
                        : "opacity-50 cursor-not-allowed text-white/50"
                    )}
                    title="Go forward"
                  >
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                  </button>
                </div>

                {/* Favorite button */}
                <button
                  onClick={() => selectedImageUrl && toggleFavorite(selectedImageUrl)}
                  disabled={!selectedImageUrl || isRefining}
                  className={cn(
                    "p-2.5 rounded-xl backdrop-blur-sm transition-all",
                    isCurrentImageFavorite
                      ? "bg-accent-secondary text-white"
                      : "bg-white/20 text-white hover:bg-white/30"
                  )}
                  title={isCurrentImageFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                  <Heart
                    className={cn("w-5 h-5", isCurrentImageFavorite && "fill-current")}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* History Strip */}
          {imageHistory.length > 1 && (
            <div className="glass-card rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-text-tertiary" />
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  History
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {imageHistory.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => goToHistoryIndex(index)}
                    className={cn(
                      "relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all",
                      index === currentHistoryIndex
                        ? "ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-primary"
                        : "opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={url} alt={`History ${index + 1}`} className="w-full h-full object-cover" />
                    {favorites.includes(url) && (
                      <div className="absolute top-0.5 right-0.5 w-4 h-4 bg-accent-secondary rounded-full flex items-center justify-center">
                        <Star className="w-2.5 h-2.5 text-white fill-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Favorites Bank */}
          {favorites.length > 0 && (
            <div className="glass-card rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-accent-secondary" />
                <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                  Favorites ({favorites.length})
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {favorites.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageUrl(url)}
                    className={cn(
                      "relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all",
                      url === selectedImageUrl
                        ? "ring-2 ring-accent-secondary ring-offset-2 ring-offset-bg-primary"
                        : "opacity-80 hover:opacity-100"
                    )}
                  >
                    <img src={url} alt={`Favorite ${index + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-accent-secondary/20" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Estimate */}
          {priceBreakdown && (
            <div className="glass-card rounded-2xl p-5 animate-fade-in-up">
              <div className="mb-3">
                <h3 className="font-semibold text-text-primary">{t("estimatedPrice")}</h3>
              </div>
              <div className="text-2xl font-display font-bold text-gradient">
                {formatPrice(priceBreakdown.total)}
              </div>
              <p className="text-xs text-text-tertiary mt-1">{t("priceNote")}</p>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="space-y-4">
          {/* Chat Panel */}
          <div
            className={cn(
              "glass-card rounded-2xl overflow-hidden animate-fade-in-up",
              "flex flex-col",
              "h-[450px]"
            )}
          >
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-primary" />
              <span className="text-sm font-medium text-text-primary">{tChat("title")}</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-sm text-text-tertiary text-center">
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
                        ? "bg-accent-primary/10 border border-accent-primary/30 text-text-primary ml-auto"
                        : "bg-bg-tertiary text-text-secondary"
                    )}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              {(isSendingChat || isRefining) && (
                <div className="bg-bg-tertiary p-3 rounded-xl max-w-[85%]">
                  <Loader2 className="w-4 h-4 text-text-tertiary animate-spin" />
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleChatSubmit()}
                  placeholder={t("chatPlaceholder")}
                  className="flex-1 px-4 py-2 rounded-xl bg-bg-tertiary border border-border text-text-primary placeholder:text-text-tertiary text-sm focus:outline-none focus:border-accent-primary/50 transition-colors"
                  disabled={isSendingChat || isRefining}
                />
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() || isSendingChat || isRefining}
                  className="px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Suggestions */}
          <div className="space-y-2">
            <p className="text-xs text-text-tertiary">{tChat("suggestions.title")}</p>
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
                  disabled={isSendingChat || isRefining}
                  className="px-3 py-1.5 text-xs bg-bg-secondary text-text-secondary rounded-full hover:bg-bg-tertiary hover:text-accent-primary transition-all border border-border hover:border-accent-primary/50 disabled:opacity-50"
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
