"use client";

import { useState, useCallback } from "react";
import { LiveCalculator } from "./LiveCalculator";
import { PricingPipeline } from "./PricingPipeline";
import { MarketDataCard } from "./MarketDataCard";
import { StageDetails } from "./StageDetails";
import type { PricingBreakdown } from "@/lib/pricing/calculator";

interface User {
  name: string;
  email: string;
  image?: string;
}

interface PricingDashboardProps {
  locale: string;
  user: User;
}

export type PipelineStage = 
  | "input" 
  | "materials" 
  | "stones" 
  | "labor" 
  | "overhead" 
  | "total";

export interface CalculatorInput {
  jewelryType: "ring" | "necklace" | "bracelet" | "earrings";
  material: "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum";
  size: "small" | "medium" | "large";
  description: string;
  stones: Array<{
    type: "diamond" | "sapphire" | "ruby" | "emerald";
    size: "tiny" | "small" | "medium" | "large" | "statement";
    quality: "economy" | "standard" | "premium" | "luxury";
    quantity: number;
  }>;
}

export function PricingDashboard({ locale, user }: PricingDashboardProps) {
  const [input, setInput] = useState<CalculatorInput>({
    jewelryType: "ring",
    material: "gold_18k",
    size: "medium",
    description: "",
    stones: [],
  });
  
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const response = await fetch("/api/pricing/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          includeAIEstimate: true,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBreakdown(data.breakdown);
        setActiveStage("total");
      } else {
        setError(data.error || "Failed to calculate price");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Calculation error:", err);
    } finally {
      setIsCalculating(false);
    }
  }, [input]);

  const handleInputChange = useCallback((newInput: Partial<CalculatorInput>) => {
    setInput(prev => ({ ...prev, ...newInput }));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">
                  Pricing Calculator
                </h1>
                <p className="text-xs text-dark-400">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-dark-400">{user.email}</p>
              </div>
              <button
                onClick={async () => {
                  await fetch("/api/admin/logout", { method: "POST" });
                  window.location.href = `/${locale}/admin/login`;
                }}
                className="px-3 py-2 text-sm text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                title="Sign out"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Calculator & Market Data */}
          <div className="lg:col-span-4 space-y-6">
            <LiveCalculator
              input={input}
              onChange={handleInputChange}
              onCalculate={handleCalculate}
              isCalculating={isCalculating}
            />
            
            <MarketDataCard />
          </div>

          {/* Main Area - Pipeline & Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Visual Pipeline */}
            <PricingPipeline
              breakdown={breakdown}
              activeStage={activeStage}
              onStageClick={setActiveStage}
              isCalculating={isCalculating}
            />
            
            {/* Error Display */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}
            
            {/* Stage Details */}
            <StageDetails
              breakdown={breakdown}
              input={input}
              activeStage={activeStage}
              onStageChange={setActiveStage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
