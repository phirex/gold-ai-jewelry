"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type Gender = "man" | "woman" | "unisex";
export type JewelryType = "ring" | "necklace" | "bracelet" | "earrings";
export type Material = "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum";
export type ConversionStep = "idle" | "enhancing" | "enhanced" | "converting" | "complete" | "error";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  timestamp: number;
}

export interface StudioState {
  // Design selections
  gender: Gender | null;
  jewelryType: JewelryType | null;
  material: Material;
  description: string;

  // Generated images (2 variations)
  variations: [string | null, string | null];
  selectedIndex: 0 | 1 | null;
  isGenerating: boolean;

  // History & favorites
  imageHistory: string[];
  currentHistoryIndex: number;
  favorites: string[];

  // Refinement chat
  chatMessages: ChatMessage[];
  isRefining: boolean;

  // 3D conversion
  modelUrl: string | null;
  enhancedImageUrl: string | null;
  isConverting: boolean;
  conversionStep: ConversionStep;
  conversionProgress: number;
  conversionError: string | null;

  // Pricing
  priceEstimate: number | null;

  // Database tracking - to update the SAME design record
  currentDesignId: string | null;
}

interface StudioContextType extends StudioState {
  // Setters
  setGender: (gender: Gender | null) => void;
  setJewelryType: (type: JewelryType | null) => void;
  setMaterial: (material: Material) => void;
  setDescription: (description: string) => void;

  // Variation management
  setVariations: (variations: [string | null, string | null]) => void;
  selectVariation: (index: 0 | 1) => void;
  setIsGenerating: (isGenerating: boolean) => void;

  // History & favorites
  addToHistory: (imageUrl: string) => void;
  goBackInHistory: () => void;
  goForwardInHistory: () => void;
  goToHistoryIndex: (index: number) => void;
  toggleFavorite: (imageUrl: string) => void;
  isFavorite: (imageUrl: string) => boolean;
  canGoBack: () => boolean;
  canGoForward: () => boolean;

  // Chat
  addChatMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  setIsRefining: (isRefining: boolean) => void;
  clearChat: () => void;

  // 3D conversion
  setModelUrl: (url: string | null) => void;
  setEnhancedImageUrl: (url: string | null) => void;
  setIsConverting: (isConverting: boolean) => void;
  setConversionStep: (step: ConversionStep) => void;
  setConversionProgress: (progress: number) => void;
  setConversionError: (error: string | null) => void;
  resetConversion: () => void;

  // Pricing
  setPriceEstimate: (price: number | null) => void;

  // Database tracking
  setCurrentDesignId: (id: string | null) => void;

  // Computed
  constructPrompt: () => string;
  getSelectedImage: () => string | null;
  canGenerate: () => boolean;
  canConvert: () => boolean;

  // Actions
  reset: () => void;
}

const initialState: StudioState = {
  gender: null,
  jewelryType: null,
  material: "gold_18k",
  description: "",
  variations: [null, null],
  selectedIndex: null,
  isGenerating: false,
  imageHistory: [],
  currentHistoryIndex: -1,
  favorites: [],
  chatMessages: [],
  isRefining: false,
  modelUrl: null,
  enhancedImageUrl: null,
  isConverting: false,
  conversionStep: "idle",
  conversionProgress: 0,
  conversionError: null,
  priceEstimate: null,
  currentDesignId: null,
};

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudioState>(initialState);

  // Basic setters
  const setGender = useCallback((gender: Gender | null) => {
    setState((prev) => ({ ...prev, gender }));
  }, []);

  const setJewelryType = useCallback((jewelryType: JewelryType | null) => {
    setState((prev) => ({ ...prev, jewelryType }));
  }, []);

  const setMaterial = useCallback((material: Material) => {
    setState((prev) => ({ ...prev, material }));
  }, []);

  const setDescription = useCallback((description: string) => {
    setState((prev) => ({ ...prev, description }));
  }, []);

  // Variation management
  const setVariations = useCallback((variations: [string | null, string | null]) => {
    setState((prev) => {
      // Auto-select first variation if none selected
      const selectedIndex = prev.selectedIndex ?? (variations[0] ? 0 : null);
      return { ...prev, variations, selectedIndex };
    });
  }, []);

  const selectVariation = useCallback((index: 0 | 1) => {
    setState((prev) => ({ ...prev, selectedIndex: index }));
  }, []);

  const setIsGenerating = useCallback((isGenerating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating }));
  }, []);

  // History management
  const addToHistory = useCallback((imageUrl: string) => {
    setState((prev) => {
      const newHistory = prev.currentHistoryIndex < prev.imageHistory.length - 1
        ? [...prev.imageHistory.slice(0, prev.currentHistoryIndex + 1), imageUrl]
        : [...prev.imageHistory, imageUrl];

      return {
        ...prev,
        imageHistory: newHistory,
        currentHistoryIndex: newHistory.length - 1,
      };
    });
  }, []);

  const goBackInHistory = useCallback(() => {
    setState((prev) => {
      if (prev.currentHistoryIndex <= 0) return prev;
      const newIndex = prev.currentHistoryIndex - 1;
      const historyImage = prev.imageHistory[newIndex];
      return {
        ...prev,
        currentHistoryIndex: newIndex,
        variations: [historyImage, prev.variations[1]],
        selectedIndex: 0,
      };
    });
  }, []);

  const goForwardInHistory = useCallback(() => {
    setState((prev) => {
      if (prev.currentHistoryIndex >= prev.imageHistory.length - 1) return prev;
      const newIndex = prev.currentHistoryIndex + 1;
      const historyImage = prev.imageHistory[newIndex];
      return {
        ...prev,
        currentHistoryIndex: newIndex,
        variations: [historyImage, prev.variations[1]],
        selectedIndex: 0,
      };
    });
  }, []);

  const goToHistoryIndex = useCallback((index: number) => {
    setState((prev) => {
      if (index < 0 || index >= prev.imageHistory.length) return prev;
      const historyImage = prev.imageHistory[index];
      return {
        ...prev,
        currentHistoryIndex: index,
        variations: [historyImage, prev.variations[1]],
        selectedIndex: 0,
      };
    });
  }, []);

  const toggleFavorite = useCallback((imageUrl: string) => {
    setState((prev) => {
      const isFav = prev.favorites.includes(imageUrl);
      return {
        ...prev,
        favorites: isFav
          ? prev.favorites.filter((url) => url !== imageUrl)
          : [...prev.favorites, imageUrl],
      };
    });
  }, []);

  const isFavorite = useCallback(
    (imageUrl: string) => state.favorites.includes(imageUrl),
    [state.favorites]
  );

  const canGoBack = useCallback(
    () => state.currentHistoryIndex > 0,
    [state.currentHistoryIndex]
  );

  const canGoForward = useCallback(
    () => state.currentHistoryIndex < state.imageHistory.length - 1,
    [state.currentHistoryIndex, state.imageHistory.length]
  );

  // Chat management
  const addChatMessage = useCallback((message: Omit<ChatMessage, "id" | "timestamp">) => {
    setState((prev) => ({
      ...prev,
      chatMessages: [
        ...prev.chatMessages,
        {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        },
      ],
    }));
  }, []);

  const setIsRefining = useCallback((isRefining: boolean) => {
    setState((prev) => ({ ...prev, isRefining }));
  }, []);

  const clearChat = useCallback(() => {
    setState((prev) => ({ ...prev, chatMessages: [] }));
  }, []);

  // 3D conversion
  const setModelUrl = useCallback((modelUrl: string | null) => {
    setState((prev) => ({ ...prev, modelUrl }));
  }, []);

  const setEnhancedImageUrl = useCallback((enhancedImageUrl: string | null) => {
    setState((prev) => ({ ...prev, enhancedImageUrl }));
  }, []);

  const setIsConverting = useCallback((isConverting: boolean) => {
    setState((prev) => ({ ...prev, isConverting }));
  }, []);

  const setConversionStep = useCallback((conversionStep: ConversionStep) => {
    setState((prev) => ({ ...prev, conversionStep }));
  }, []);

  const setConversionProgress = useCallback((conversionProgress: number) => {
    setState((prev) => ({ ...prev, conversionProgress }));
  }, []);

  const setConversionError = useCallback((conversionError: string | null) => {
    setState((prev) => ({ ...prev, conversionError }));
  }, []);

  const resetConversion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modelUrl: null,
      enhancedImageUrl: null,
      isConverting: false,
      conversionStep: "idle",
      conversionProgress: 0,
      conversionError: null,
    }));
  }, []);

  // Pricing
  const setPriceEstimate = useCallback((priceEstimate: number | null) => {
    setState((prev) => ({ ...prev, priceEstimate }));
  }, []);

  // Database tracking
  const setCurrentDesignId = useCallback((currentDesignId: string | null) => {
    setState((prev) => ({ ...prev, currentDesignId }));
  }, []);

  // Computed helpers
  const constructPrompt = useCallback(() => {
    const { gender, jewelryType, description, material } = state;
    if (!gender || !jewelryType) return "";

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

  const getSelectedImage = useCallback(() => {
    const { variations, selectedIndex } = state;
    if (selectedIndex === null) return null;
    return variations[selectedIndex];
  }, [state]);

  const canGenerate = useCallback(() => {
    const { gender, jewelryType, description } = state;
    return gender !== null && jewelryType !== null && description.trim().length >= 10;
  }, [state]);

  const canConvert = useCallback(() => {
    const { variations, selectedIndex, conversionStep } = state;
    return (
      selectedIndex !== null &&
      variations[selectedIndex] !== null &&
      conversionStep === "idle"
    );
  }, [state]);

  // Reset
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const value: StudioContextType = {
    ...state,
    setGender,
    setJewelryType,
    setMaterial,
    setDescription,
    setVariations,
    selectVariation,
    setIsGenerating,
    addToHistory,
    goBackInHistory,
    goForwardInHistory,
    goToHistoryIndex,
    toggleFavorite,
    isFavorite,
    canGoBack,
    canGoForward,
    addChatMessage,
    setIsRefining,
    clearChat,
    setModelUrl,
    setEnhancedImageUrl,
    setIsConverting,
    setConversionStep,
    setConversionProgress,
    setConversionError,
    resetConversion,
    setPriceEstimate,
    setCurrentDesignId,
    constructPrompt,
    getSelectedImage,
    canGenerate,
    canConvert,
    reset,
  };

  return (
    <StudioContext.Provider value={value}>
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error("useStudio must be used within a StudioProvider");
  }
  return context;
}
