"use client";

import { cn } from "@/lib/utils/cn";
import type { PricingBreakdown } from "@/lib/pricing/calculator";
import type { PipelineStage } from "./PricingDashboard";

interface PricingPipelineProps {
  breakdown: PricingBreakdown | null;
  activeStage: PipelineStage | null;
  onStageClick: (stage: PipelineStage) => void;
  isCalculating: boolean;
}

interface StageConfig {
  id: PipelineStage;
  label: string;
  icon: React.ReactNode;
  getValue: (breakdown: PricingBreakdown) => string;
  color: string;
}

const formatILS = (amount: number) => `₪${amount.toLocaleString()}`;

const stages: StageConfig[] = [
  {
    id: "input",
    label: "Input",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    getValue: () => "Design Specs",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "materials",
    label: "Materials",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    getValue: (b) => formatILS(b.materials.subtotal),
    color: "from-amber-500 to-yellow-500",
  },
  {
    id: "stones",
    label: "Stones",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 3z" />
      </svg>
    ),
    getValue: (b) => b.stones.subtotal > 0 ? formatILS(b.stones.subtotal) : "—",
    color: "from-cyan-500 to-teal-500",
  },
  {
    id: "labor",
    label: "Labor",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    getValue: (b) => formatILS(b.labor.subtotal),
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "overhead",
    label: "Overhead",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    getValue: (b) => formatILS(b.overhead.subtotal),
    color: "from-rose-500 to-pink-500",
  },
  {
    id: "total",
    label: "Total",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    getValue: (b) => formatILS(b.total),
    color: "from-gold-400 to-gold-600",
  },
];

export function PricingPipeline({
  breakdown,
  activeStage,
  onStageClick,
  isCalculating,
}: PricingPipelineProps) {
  return (
    <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Calculation Pipeline</h2>
        {breakdown && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-dark-400">Final Price:</span>
            <span className="text-gradient-gold-bright font-bold text-xl">
              {formatILS(breakdown.total)}
            </span>
          </div>
        )}
      </div>

      {/* Pipeline Visual */}
      <div className="relative">
        {/* Connection Lines */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-dark-700 -translate-y-1/2 z-0" />
        
        {/* Animated flow line when calculating */}
        {isCalculating && (
          <div className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 z-0 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-transparent via-gold-500 to-transparent animate-flow" />
          </div>
        )}
        
        {/* Filled connection when has data */}
        {breakdown && (
          <div 
            className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-gold-500 to-gold-400 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: "100%" }}
          />
        )}

        {/* Stage Nodes */}
        <div className="relative z-10 flex items-center justify-between">
          {stages.map((stage, index) => {
            const isActive = activeStage === stage.id;
            const hasValue = breakdown !== null;
            
            return (
              <button
                key={stage.id}
                onClick={() => onStageClick(stage.id)}
                className={cn(
                  "group relative flex flex-col items-center gap-2 transition-all duration-300",
                  isCalculating && "pointer-events-none"
                )}
              >
                {/* Node */}
                <div
                  className={cn(
                    "relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300",
                    "border-2",
                    isActive
                      ? `bg-gradient-to-br ${stage.color} border-transparent shadow-lg shadow-${stage.color.split("-")[1]}-500/30`
                      : hasValue
                        ? "bg-dark-700 border-dark-500 hover:border-gold-500/50"
                        : "bg-dark-800 border-dark-600",
                    isCalculating && index <= 1 && "animate-pulse"
                  )}
                >
                  <span className={cn(
                    "transition-colors duration-300",
                    isActive ? "text-white" : hasValue ? "text-dark-300" : "text-dark-500"
                  )}>
                    {stage.icon}
                  </span>
                  
                  {/* Pulse ring on active */}
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl animate-ping-slow bg-gold-500/20" />
                  )}
                </div>

                {/* Label */}
                <span className={cn(
                  "text-xs font-medium transition-colors duration-300",
                  isActive ? "text-gold-400" : "text-dark-400"
                )}>
                  {stage.label}
                </span>

                {/* Value Badge */}
                {hasValue && stage.id !== "input" && (
                  <span className={cn(
                    "absolute -bottom-6 text-xs font-mono transition-all duration-300",
                    isActive ? "text-white" : "text-dark-500"
                  )}>
                    {stage.getValue(breakdown)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Click hint */}
      <p className="text-center text-xs text-dark-500 mt-10">
        Click any stage to see detailed calculations
      </p>

      {/* Price Range */}
      {breakdown && breakdown.priceRange.low !== breakdown.priceRange.high && (
        <div className="mt-6 pt-4 border-t border-dark-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dark-400">Price Range</span>
            <span className="text-dark-300 font-mono">
              {formatILS(breakdown.priceRange.low)} — {formatILS(breakdown.priceRange.high)}
            </span>
          </div>
          <div className="mt-2 h-2 bg-dark-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-gold-600 to-gold-400 rounded-full"
              style={{ 
                width: `${((breakdown.total - breakdown.priceRange.low) / (breakdown.priceRange.high - breakdown.priceRange.low)) * 100}%`,
                marginLeft: `${((breakdown.priceRange.low) / (breakdown.priceRange.high)) * 10}%`
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-dark-500 mt-1">
            <span>Low estimate</span>
            <span>High estimate</span>
          </div>
        </div>
      )}
    </div>
  );
}
