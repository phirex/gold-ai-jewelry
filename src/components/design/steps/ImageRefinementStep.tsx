"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, Sparkles, Send, RefreshCw } from "lucide-react";
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
  } = useDesignWizard();

  const [currentPrompt] = useState(constructPrompt());
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

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
          strength: 0.65, // Higher strength for more visible changes
        }),
      });

      if (!response.ok) throw new Error("Refinement failed");

      const data = await response.json();
      if (data.imageUrl) {
        setSelectedImageUrl(data.imageUrl);
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

      // If AI suggests regenerating, refine the image using img2img
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gradient-gold-bright">
          {t("title")}
        </h2>
        <p className="text-dark-400">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Left: Selected Image */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-gold-500 bg-dark-800">
            {isRefining ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-dark-800">
                <div className="relative">
                  <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-xl animate-pulse scale-150" />
                  <RefreshCw className="w-12 h-12 text-gold-400 animate-spin relative" />
                </div>
                <span className="text-sm text-gold-400 mt-4">{t("refiningImage")}</span>
                <span className="text-xs text-dark-500 mt-1">{t("pleaseWait")}</span>
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
          </div>

          {/* Price Estimate */}
          {priceBreakdown && (
            <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 animate-fade-in-up">
              <div className="mb-3">
                <h3 className="font-semibold text-dark-100">{t("estimatedPrice")}</h3>
              </div>
              <div className="text-2xl font-bold text-gradient-gold-bright">
                {formatPrice(priceBreakdown.total)}
              </div>
              <p className="text-xs text-dark-500 mt-1">{t("priceNote")}</p>
            </div>
          )}
        </div>

        {/* Right: Chat */}
        <div className="space-y-4">
          {/* Chat Panel */}
          <div
            className={cn(
              "bg-dark-800 rounded-2xl border border-dark-700 overflow-hidden animate-fade-in-up",
              "flex flex-col",
              "h-[400px]"
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
              {(isSendingChat || isRefining) && (
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
                  disabled={isSendingChat || isRefining}
                  className="px-3 py-1.5 text-xs bg-dark-700 text-dark-300 rounded-full hover:bg-dark-600 hover:text-gold-400 transition-all border border-dark-600 hover:border-gold-500/50 disabled:opacity-50"
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
