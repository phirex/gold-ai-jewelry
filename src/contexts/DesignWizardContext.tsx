"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Gender = "man" | "woman" | "unisex";
export type JewelryType = "ring" | "necklace" | "bracelet" | "earrings";
export type Material = "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum";

export interface PriceBreakdown {
  materials: number;
  stones: number;
  labor: number;
  total: number;
}

export interface WizardState {
  step: number;
  gender: Gender | null;
  jewelryType: JewelryType | null;
  description: string;
  constructedPrompt: string;
  variations: string[];
  selectedImageUrl: string | null;
  modelUrl: string | null;
  material: Material;
  priceBreakdown: PriceBreakdown | null;
  isGenerating: boolean;
  isConverting: boolean;
  conversionProgress: number;
  chatSessionId: string;
}

interface WizardContextType extends WizardState {
  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;

  // Setters
  setGender: (gender: Gender) => void;
  setJewelryType: (type: JewelryType) => void;
  setDescription: (description: string) => void;
  setVariations: (variations: string[]) => void;
  setSelectedImageUrl: (url: string | null) => void;
  setModelUrl: (url: string | null) => void;
  setMaterial: (material: Material) => void;
  setPriceBreakdown: (breakdown: PriceBreakdown | null) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setIsConverting: (isConverting: boolean) => void;
  setConversionProgress: (progress: number) => void;

  // Computed
  constructPrompt: () => string;

  // Actions
  reset: () => void;
  canProceed: () => boolean;
}

const initialState: WizardState = {
  step: 1,
  gender: null,
  jewelryType: null,
  description: "",
  constructedPrompt: "",
  variations: [],
  selectedImageUrl: null,
  modelUrl: null,
  material: "gold_18k",
  priceBreakdown: null,
  isGenerating: false,
  isConverting: false,
  conversionProgress: 0,
  chatSessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function DesignWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WizardState>(initialState);

  const nextStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.min(prev.step + 1, 6) }));
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  }, []);

  const goToStep = useCallback((step: number) => {
    setState((prev) => ({ ...prev, step: Math.max(1, Math.min(step, 6)) }));
  }, []);

  const setGender = useCallback((gender: Gender) => {
    setState((prev) => ({ ...prev, gender }));
  }, []);

  const setJewelryType = useCallback((jewelryType: JewelryType) => {
    setState((prev) => ({ ...prev, jewelryType }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  const setVariations = useCallback((variations: string[]) => {
    setState((prev) => ({ ...prev, variations }));
  }, []);

  const setSelectedImageUrl = useCallback((selectedImageUrl: string | null) => {
    setState((prev) => ({ ...prev, selectedImageUrl }));
  }, []);

  const setModelUrl = useCallback((modelUrl: string | null) => {
    setState((prev) => ({ ...prev, modelUrl }));
  }, []);

  const setMaterial = useCallback((material: Material) => {
    setState((prev) => ({ ...prev, material }));
  }, []);

  const setPriceBreakdown = useCallback((priceBreakdown: PriceBreakdown | null) => {
    setState((prev) => ({ ...prev, priceBreakdown }));
  }, []);

  const setIsGenerating = useCallback((isGenerating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating }));
  }, []);

  const setIsConverting = useCallback((isConverting: boolean) => {
    setState((prev) => ({ ...prev, isConverting }));
  }, []);

  const setConversionProgress = useCallback((conversionProgress: number) => {
    setState((prev) => ({ ...prev, conversionProgress }));
  }, []);

  const constructPrompt = useCallback(() => {
    const { gender, jewelryType, description, material } = state;
    if (!gender || !jewelryType) return "";

    // Build a rich, detailed prompt for better image generation
    const genderDescriptions: Record<string, string> = {
      man: "masculine, bold design suitable for men",
      woman: "elegant, feminine design for women",
      unisex: "versatile unisex design",
    };

    const materialDescriptions: Record<string, string> = {
      gold_14k: "polished 14K yellow gold with warm lustrous finish",
      gold_18k: "gleaming 18K yellow gold with rich golden color",
      gold_24k: "pure 24K gold with deep warm yellow tone",
      silver: "sterling silver 925 with bright polished surface",
      platinum: "platinum with sophisticated brushed finish",
    };

    const jewelryDescriptions: Record<string, string> = {
      ring: "finger ring with well-defined band",
      necklace: "necklace with pendant and chain",
      bracelet: "wrist bracelet",
      earrings: "pair of matching earrings",
    };

    const parts: string[] = [
      `Luxury ${jewelryDescriptions[jewelryType] || jewelryType}`,
      genderDescriptions[gender] || "",
      `crafted in ${materialDescriptions[material] || "precious metal"}`,
      description,
    ];

    return parts.filter(Boolean).join(", ");
  }, [state]);

  const reset = useCallback(() => {
    setState({
      ...initialState,
      chatSessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
  }, []);

  const canProceed = useCallback(() => {
    const { step, gender, jewelryType, description, selectedImageUrl, modelUrl } = state;

    switch (step) {
      case 1:
        return gender !== null;
      case 2:
        return jewelryType !== null;
      case 3:
        return description.trim().length >= 10;
      case 4:
        return selectedImageUrl !== null;
      case 5:
        return true; // Refinement step - can always proceed
      case 6:
        return modelUrl !== null;
      default:
        return false;
    }
  }, [state]);

  const value: WizardContextType = {
    ...state,
    nextStep,
    prevStep,
    goToStep,
    setGender,
    setJewelryType,
    setDescription,
    setVariations,
    setSelectedImageUrl,
    setModelUrl,
    setMaterial,
    setPriceBreakdown,
    setIsGenerating,
    setIsConverting,
    setConversionProgress,
    constructPrompt,
    reset,
    canProceed,
  };

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useDesignWizard() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error("useDesignWizard must be used within a DesignWizardProvider");
  }
  return context;
}
