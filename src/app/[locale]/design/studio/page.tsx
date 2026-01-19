"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  Save,
  ShoppingCart,
  Share2,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { Button } from "@/components/ui/Button";
import { ModelViewer } from "@/components/design/ModelViewer";
import { AIChat } from "@/components/design/AIChat";
import { MaterialSelector, type Material } from "@/components/design/MaterialSelector";
import { PriceDisplay } from "@/components/design/PriceDisplay";

interface PriceBreakdown {
  materials: number;
  stones: number;
  labor: number;
  total: number;
}

export default function DesignStudioPage() {
  const t = useTranslations("design.studio");
  const tActions = useTranslations("design.actions");
  const searchParams = useSearchParams();
  const locale = useLocale();

  // Get initial values from wizard
  const initialGender = searchParams.get("gender") || "woman";
  const initialType = searchParams.get("type") || "ring";
  const initialStyle = searchParams.get("style") || "classic";

  // State
  const [prompt, setPrompt] = useState("");
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>("");
  const [material, setMaterial] = useState<Material>("gold_18k");
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);
  const [isPriceLoading, setIsPriceLoading] = useState(false);

  // Chat session ID - stable per page load
  const sessionIdRef = useRef<string>(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

  // Suggested prompts based on jewelry type and locale
  const suggestions: Record<string, Record<string, string[]>> = {
    en: {
      ring: [
        "Classic solitaire engagement ring with a round diamond",
        "Minimalist gold band with delicate texture",
        "Vintage-inspired ring with intricate filigree details",
        "Bold statement ring with geometric patterns",
      ],
      necklace: [
        "Delicate chain necklace with a teardrop pendant",
        "Modern bar necklace with brushed finish",
        "Layered chain necklace with small charms",
        "Statement collar necklace with geometric shapes",
      ],
      bracelet: [
        "Tennis bracelet with small diamonds",
        "Minimalist cuff bracelet with clean lines",
        "Chain link bracelet with toggle clasp",
        "Bangle bracelet with hammered texture",
      ],
      earrings: [
        "Classic diamond stud earrings",
        "Elegant drop earrings with pearls",
        "Modern geometric hoop earrings",
        "Delicate threader earrings",
      ],
    },
    he: {
      ring: [
        "טבעת אירוסין קלאסית עם יהלום עגול",
        "טבעת זהב מינימליסטית עם מרקם עדין",
        "טבעת בסגנון וינטג' עם עיטורים מורכבים",
        "טבעת סטייטמנט נועזת עם דגמים גיאומטריים",
      ],
      necklace: [
        "שרשרת עדינה עם תליון בצורת דמעה",
        "שרשרת בר מודרנית עם גימור מוברש",
        "שרשרת שכבות עם תליונים קטנים",
        "שרשרת צווארון מרשימה עם צורות גיאומטריות",
      ],
      bracelet: [
        "צמיד טניס עם יהלומים קטנים",
        "צמיד קאף מינימליסטי עם קווים נקיים",
        "צמיד חוליות עם סוגר טוגל",
        "צמיד בנגל עם מרקם פטיש",
      ],
      earrings: [
        "עגילי יהלום צמודים קלאסיים",
        "עגילים נופלים אלגנטיים עם פנינים",
        "עגילי חישוק גיאומטריים מודרניים",
        "עגילי חוט עדינים",
      ],
    },
  };

  const currentSuggestions = suggestions[locale]?.[initialType] || suggestions.en[initialType] || suggestions.en.ring;

  // Generate design function - can be called with custom prompt
  const generateDesign = useCallback(async (designPrompt: string) => {
    if (!designPrompt.trim()) return;

    setIsGenerating(true);
    setIsPriceLoading(true);
    setModelUrl(null);
    setPreviewImageUrl(null);
    setGenerationStage(t("creatingImage"));

    try {
      // Start generation
      const generateResponse = await fetch("/api/designs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: designPrompt,
          jewelryType: initialType,
          targetGender: initialGender,
          style: initialStyle,
          material,
        }),
      });

      const generateData = await generateResponse.json();

      if (!generateData.success) {
        throw new Error(generateData.error || "Failed to start generation");
      }

      const taskId = generateData.taskId;

      // If we got a preview image from image-to-3D pipeline, show it
      if (generateData.previewImageUrl) {
        setPreviewImageUrl(generateData.previewImageUrl);
        setGenerationStage(t("convertingTo3D"));
      } else {
        setGenerationStage(t("creating3DModel"));
      }

      // Poll for completion
      let attempts = 0;
      const maxAttempts = 90; // 4.5 minutes max for image-to-3D pipeline

      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 3000));

        const statusResponse = await fetch(`/api/designs/status?taskId=${taskId}`);
        const statusData = await statusResponse.json();

        // Update preview image if available
        if (statusData.previewImageUrl && !previewImageUrl) {
          setPreviewImageUrl(statusData.previewImageUrl);
        }

        if (statusData.status === "success" || statusData.status === "SUCCEEDED") {
          setModelUrl(statusData.modelUrl);
          setGenerationStage("");
          break;
        } else if (statusData.status === "failed" || statusData.status === "FAILED") {
          throw new Error("Generation failed");
        }

        // Update stage based on progress
        if (statusData.progress > 0) {
          setGenerationStage(t("convertingProgress", { progress: Math.round(statusData.progress) }));
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error("Generation timed out");
      }

      // Calculate price based on material
      const materialMultipliers: Record<Material, number> = {
        gold_14k: 0.8,
        gold_18k: 1.0,
        gold_24k: 1.3,
        silver: 0.3,
        platinum: 1.5,
      };

      const baseMaterialCost = 2500;
      const materialCost = Math.round(baseMaterialCost * materialMultipliers[material]);
      const stonesCost = 1500;
      const laborCost = 800;

      setPriceBreakdown({
        materials: materialCost,
        stones: stonesCost,
        labor: laborCost,
        total: materialCost + stonesCost + laborCost,
      });
    } catch (error) {
      console.error("Generation failed:", error);
      alert(t("generationFailed"));
    } finally {
      setIsGenerating(false);
      setIsPriceLoading(false);
    }
  }, [initialType, initialGender, initialStyle, material, t]);

  // Handle generate button click
  const handleGenerate = async () => {
    await generateDesign(prompt);
  };

  // Handle chat messages for design refinement
  const handleChatMessage = useCallback(
    async (message: string): Promise<string> => {
      try {
        // Call the chat API with context
        const response = await fetch("/api/chat/design", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: sessionIdRef.current,
            message,
            context: {
              jewelryType: initialType,
              targetGender: initialGender,
              style: initialStyle,
              material,
              currentPrompt: prompt,
              locale,
            },
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to get response");
        }

        // If Claude suggests regenerating with a new prompt, do it
        if (data.shouldRegenerate && data.newPrompt) {
          // Update the prompt in the UI
          setPrompt(data.newPrompt);
          // Trigger regeneration with the new prompt
          generateDesign(data.newPrompt);
        }

        return data.message;
      } catch (error) {
        console.error("Chat error:", error);
        return t("chat.errorMessage");
      }
    },
    [initialType, initialGender, initialStyle, material, prompt, locale, generateDesign, t]
  );

  // Handle material change
  const handleMaterialChange = (newMaterial: Material) => {
    setMaterial(newMaterial);

    // Recalculate price based on material
    if (priceBreakdown) {
      const materialMultipliers: Record<Material, number> = {
        gold_14k: 0.8,
        gold_18k: 1.0,
        gold_24k: 1.3,
        silver: 0.3,
        platinum: 1.5,
      };

      const baseMaterialCost = 2500;
      const newMaterialCost = Math.round(
        baseMaterialCost * materialMultipliers[newMaterial]
      );

      setPriceBreakdown({
        ...priceBreakdown,
        materials: newMaterialCost,
        total: newMaterialCost + priceBreakdown.stones + priceBreakdown.labor,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-900">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold mb-8 text-gradient-gold-bright animate-fade-in">{t("title")}</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: 3D Preview + Prompt */}
            <div className="lg:col-span-2 space-y-4">
              {/* 3D Viewer */}
              <ModelViewer
                modelUrl={modelUrl}
                previewImageUrl={previewImageUrl}
                isLoading={isGenerating}
                loadingStage={generationStage}
                className="aspect-square lg:aspect-video"
              />

              {/* Prompt Input */}
              <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 animate-fade-in-up delay-100">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={t("promptPlaceholder")}
                  className="w-full resize-none rounded-xl border border-dark-700 bg-dark-850 text-dark-100 placeholder:text-dark-500 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50 min-h-[100px] transition-all"
                  disabled={isGenerating}
                />

                {/* Suggestions */}
                <div className="mt-3">
                  <p className="text-xs text-dark-400 mb-2">
                    {t("suggestions.title")}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setPrompt(suggestion)}
                        className="px-3 py-1.5 text-xs bg-dark-700 text-dark-300 rounded-full hover:bg-dark-600 hover:text-gold-400 transition-all duration-200 truncate max-w-[200px] border border-dark-600 hover:border-gold-500/50"
                        disabled={isGenerating}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="gradient"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || isGenerating}
                    className="flex-1"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("generating")}
                      </>
                    ) : modelUrl ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t("regenerate")}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t("generate")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: Chat + Options */}
            <div className="space-y-4">
              {/* AI Chat */}
              <div className="rounded-2xl border border-dark-700 h-[400px] overflow-hidden animate-fade-in-up delay-150">
                <AIChat onSendMessage={handleChatMessage} isGenerating={isGenerating} />
              </div>

              {/* Material Selector */}
              <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 animate-fade-in-up delay-200">
                <MaterialSelector value={material} onChange={handleMaterialChange} />
              </div>

              {/* Price Display */}
              <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 animate-fade-in-up delay-250">
                <PriceDisplay
                  breakdown={priceBreakdown}
                  isLoading={isPriceLoading}
                />
              </div>

              {/* Actions */}
              <div className="bg-dark-800 rounded-2xl p-5 border border-dark-700 space-y-3 animate-fade-in-up delay-300">
                <Button variant="gradient" className="w-full" disabled={!modelUrl}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  {tActions("addToCart")}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" disabled={!modelUrl}>
                    <Save className="mr-2 h-4 w-4" />
                    {tActions("saveDesign")}
                  </Button>
                  <Button variant="outline" disabled={!modelUrl}>
                    <Share2 className="mr-2 h-4 w-4" />
                    {tActions("share")}
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => {
                    setPrompt("");
                    setModelUrl(null);
                    setPreviewImageUrl(null);
                    setGenerationStage("");
                    setPriceBreakdown(null);
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {tActions("startOver")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
