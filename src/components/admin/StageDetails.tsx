"use client";

import { cn } from "@/lib/utils/cn";
import type { PricingBreakdown } from "@/lib/pricing/calculator";
import type { PipelineStage, CalculatorInput } from "./PricingDashboard";

interface StageDetailsProps {
  breakdown: PricingBreakdown | null;
  input: CalculatorInput;
  activeStage: PipelineStage | null;
  onStageChange: (stage: PipelineStage) => void;
}

const formatILS = (amount: number) => `₪${amount.toLocaleString()}`;

// Material densities for display
const MATERIAL_DENSITIES: Record<string, number> = {
  gold_14k: 13.2,
  gold_18k: 15.5,
  gold_24k: 19.3,
  silver: 10.5,
  platinum: 21.45,
};

// Base volumes for display
const BASE_VOLUMES: Record<string, number> = {
  ring: 0.8,
  necklace: 3.5,
  bracelet: 2.5,
  earrings: 0.6,
};

const SIZE_MULTIPLIERS: Record<string, number> = {
  small: 0.7,
  medium: 1.0,
  large: 1.4,
};

export function StageDetails({
  breakdown,
  input,
  activeStage,
  onStageChange,
}: StageDetailsProps) {
  if (!breakdown) {
    return (
      <div className="bg-dark-800 rounded-2xl border border-dark-700 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-dark-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-dark-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Calculation Yet</h3>
        <p className="text-dark-400 text-sm">
          Fill in the calculator and click &ldquo;Calculate Price&rdquo; to see the detailed breakdown
        </p>
      </div>
    );
  }

  const stages: Array<{
    id: PipelineStage;
    title: string;
    content: React.ReactNode;
  }> = [
    {
      id: "input",
      title: "Input Parameters",
      content: <InputStageContent input={input} />,
    },
    {
      id: "materials",
      title: "Material Calculation",
      content: <MaterialStageContent breakdown={breakdown} input={input} />,
    },
    {
      id: "stones",
      title: "Stone Pricing",
      content: <StoneStageContent breakdown={breakdown} />,
    },
    {
      id: "labor",
      title: "Labor Estimation",
      content: <LaborStageContent breakdown={breakdown} />,
    },
    {
      id: "overhead",
      title: "Overhead & Costs",
      content: <OverheadStageContent breakdown={breakdown} />,
    },
    {
      id: "total",
      title: "Final Price Breakdown",
      content: <TotalStageContent breakdown={breakdown} />,
    },
  ];

  return (
    <div className="bg-dark-800 rounded-2xl border border-dark-700">
      <div className="p-4 border-b border-dark-700">
        <h2 className="text-lg font-semibold text-white">Stage Details</h2>
        <p className="text-sm text-dark-400">Click on stages above or expand sections below</p>
      </div>
      
      <div className="divide-y divide-dark-700">
        {stages.map((stage) => (
          <div key={stage.id}>
            <button
              onClick={() => onStageChange(activeStage === stage.id ? null as unknown as PipelineStage : stage.id)}
              className={cn(
                "w-full flex items-center justify-between p-4 text-left transition-colors",
                activeStage === stage.id
                  ? "bg-gold-500/10"
                  : "hover:bg-dark-700/50"
              )}
            >
              <span className={cn(
                "font-medium",
                activeStage === stage.id ? "text-gold-400" : "text-dark-200"
              )}>
                {stage.title}
              </span>
              <svg
                className={cn(
                  "w-5 h-5 transition-transform",
                  activeStage === stage.id ? "rotate-180 text-gold-400" : "text-dark-500"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {activeStage === stage.id && (
              <div className="px-4 pb-4">
                {stage.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Stage content components

function InputStageContent({ input }: { input: CalculatorInput }) {
  const volume = BASE_VOLUMES[input.jewelryType] * SIZE_MULTIPLIERS[input.size];
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <InfoCard label="Jewelry Type" value={input.jewelryType} />
        <InfoCard label="Material" value={input.material.replace("_", " ")} />
        <InfoCard label="Size" value={input.size} />
        <InfoCard label="Volume Estimate" value={`${volume.toFixed(2)} cm³`} highlight />
      </div>
      
      <div className="p-4 rounded-lg bg-dark-700/50">
        <h4 className="text-xs font-medium text-dark-400 mb-2">Description</h4>
        <p className="text-sm text-dark-200">
          {input.description || "No description provided"}
        </p>
      </div>

      {input.stones.length > 0 && (
        <div className="p-4 rounded-lg bg-dark-700/50">
          <h4 className="text-xs font-medium text-dark-400 mb-2">Stones ({input.stones.length})</h4>
          <div className="space-y-2">
            {input.stones.map((stone, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-dark-300 capitalize">{stone.type}</span>
                <span className="text-dark-400">
                  {stone.quantity}x {stone.size} ({stone.quality})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialStageContent({ 
  breakdown, 
  input 
}: { 
  breakdown: PricingBreakdown; 
  input: CalculatorInput;
}) {
  const density = MATERIAL_DENSITIES[input.material];
  
  return (
    <div className="space-y-4">
      <FormulaDisplay
        title="Weight Calculation"
        formula="Volume × Density = Weight"
        calculation={`${(breakdown.materials.weightGrams / density).toFixed(2)} cm³ × ${density} g/cm³ = ${breakdown.materials.weightGrams}g`}
      />
      
      <FormulaDisplay
        title="Material Cost"
        formula="Weight × Price/gram × Waste Factor = Cost"
        calculation={`${breakdown.materials.weightGrams}g × ${formatILS(breakdown.materials.pricePerGram)}/g × ${breakdown.materials.wasteFactor} = ${formatILS(breakdown.materials.subtotal)}`}
      />

      <div className="grid grid-cols-3 gap-4 pt-4">
        <InfoCard label="Weight" value={`${breakdown.materials.weightGrams}g`} />
        <InfoCard label="Spot Price" value={`${formatILS(breakdown.materials.pricePerGram)}/g`} />
        <InfoCard label="Waste Factor" value={`${((breakdown.materials.wasteFactor - 1) * 100).toFixed(0)}%`} />
      </div>

      <ResultCard label="Material Subtotal" value={formatILS(breakdown.materials.subtotal)} />
    </div>
  );
}

function StoneStageContent({ breakdown }: { breakdown: PricingBreakdown }) {
  if (breakdown.stones.items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-dark-400">No stones in this calculation</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-dark-600">
        <table className="w-full text-sm">
          <thead className="bg-dark-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-dark-400">Stone</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-dark-400">Qty</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-dark-400">Unit Price</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-dark-400">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700">
            {breakdown.stones.items.map((stone, i) => (
              <tr key={i} className="bg-dark-700/30">
                <td className="px-4 py-3 text-dark-200 capitalize">{stone.type}</td>
                <td className="px-4 py-3 text-right text-dark-300">{stone.quantity}</td>
                <td className="px-4 py-3 text-right text-dark-300 font-mono">
                  {formatILS(stone.unitPrice)}
                </td>
                <td className="px-4 py-3 text-right text-white font-mono font-medium">
                  {formatILS(stone.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ResultCard label="Stones Subtotal" value={formatILS(breakdown.stones.subtotal)} />
    </div>
  );
}

function LaborStageContent({ breakdown }: { breakdown: PricingBreakdown }) {
  const confidencePercent = (breakdown.labor.confidence || 0.7) * 100;
  
  return (
    <div className="space-y-4">
      {/* AI Reasoning */}
      {breakdown.labor.reasoning && (
        <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-purple-300 mb-1">AI Analysis</h4>
              <p className="text-sm text-dark-300">{breakdown.labor.reasoning}</p>
            </div>
          </div>
        </div>
      )}

      <FormulaDisplay
        title="Labor Cost"
        formula="Estimated Hours × Hourly Rate = Labor Cost"
        calculation={`${breakdown.labor.hours}h × ${formatILS(breakdown.labor.hourlyRate)}/h = ${formatILS(breakdown.labor.subtotal)}`}
      />

      <div className="grid grid-cols-3 gap-4">
        <InfoCard label="Complexity" value={breakdown.labor.complexity} highlight />
        <InfoCard label="Est. Hours" value={`${breakdown.labor.hours}h`} />
        <InfoCard label="Hourly Rate" value={`${formatILS(breakdown.labor.hourlyRate)}/h`} />
      </div>

      {/* Confidence Meter */}
      <div className="p-4 rounded-lg bg-dark-700/50">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-dark-400">AI Confidence</span>
          <span className={cn(
            "font-medium",
            confidencePercent >= 80 ? "text-green-400" :
            confidencePercent >= 60 ? "text-yellow-400" : "text-orange-400"
          )}>
            {confidencePercent.toFixed(0)}%
          </span>
        </div>
        <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              confidencePercent >= 80 ? "bg-green-500" :
              confidencePercent >= 60 ? "bg-yellow-500" : "bg-orange-500"
            )}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
      </div>

      <ResultCard label="Labor Subtotal" value={formatILS(breakdown.labor.subtotal)} />
    </div>
  );
}

function OverheadStageContent({ breakdown }: { breakdown: PricingBreakdown }) {
  const costsBeforeOverhead = 
    breakdown.materials.subtotal + 
    breakdown.stones.subtotal + 
    breakdown.labor.subtotal;

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-dark-700/50">
        <h4 className="text-sm font-medium text-dark-300 mb-3">Cost Components</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Materials</span>
            <span className="text-dark-200 font-mono">{formatILS(breakdown.materials.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Stones</span>
            <span className="text-dark-200 font-mono">{formatILS(breakdown.stones.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Labor</span>
            <span className="text-dark-200 font-mono">{formatILS(breakdown.labor.subtotal)}</span>
          </div>
          <div className="border-t border-dark-600 pt-2 flex justify-between text-sm">
            <span className="text-dark-300 font-medium">Subtotal</span>
            <span className="text-white font-mono font-medium">{formatILS(costsBeforeOverhead)}</span>
          </div>
        </div>
      </div>

      <FormulaDisplay
        title="Overhead"
        formula={`Subtotal × ${breakdown.overhead.percentage}% = Overhead`}
        calculation={`${formatILS(costsBeforeOverhead)} × ${breakdown.overhead.percentage}% = ${formatILS(breakdown.overhead.subtotal)}`}
      />

      <ResultCard label="Cost Subtotal (with overhead)" value={formatILS(breakdown.costSubtotal)} />
    </div>
  );
}

function TotalStageContent({ breakdown }: { breakdown: PricingBreakdown }) {
  return (
    <div className="space-y-4">
      <FormulaDisplay
        title="Margin Application"
        formula={`Cost × ${breakdown.marginMultiplier}x = Final Price`}
        calculation={`${formatILS(breakdown.costSubtotal)} × ${breakdown.marginMultiplier} = ${formatILS(breakdown.total)}`}
      />

      <div className="p-4 rounded-lg bg-dark-700/50">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Cost Subtotal</span>
            <span className="text-dark-200 font-mono">{formatILS(breakdown.costSubtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-dark-400">Margin ({breakdown.marginMultiplier}x)</span>
            <span className="text-dark-200 font-mono">+{formatILS(breakdown.margin)}</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30">
        <div className="text-center">
          <p className="text-sm text-gold-400 mb-2">Final Price</p>
          <p className="text-4xl font-bold text-gradient-gold-bright">
            {formatILS(breakdown.total)}
          </p>
          {breakdown.priceRange.low !== breakdown.priceRange.high && (
            <p className="text-sm text-dark-400 mt-2">
              Range: {formatILS(breakdown.priceRange.low)} — {formatILS(breakdown.priceRange.high)}
            </p>
          )}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-dark-500">
        <span>Source: {breakdown.metadata.metalPricesSource}</span>
        <span>Labor: {breakdown.metadata.laborSource}</span>
        <span>Calculated: {new Date(breakdown.metadata.calculatedAt).toLocaleString()}</span>
      </div>
    </div>
  );
}

// Helper components

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded-lg",
      highlight ? "bg-gold-500/10 border border-gold-500/30" : "bg-dark-700/50"
    )}>
      <p className="text-xs text-dark-400 mb-1">{label}</p>
      <p className={cn(
        "text-sm font-medium capitalize",
        highlight ? "text-gold-400" : "text-white"
      )}>
        {value}
      </p>
    </div>
  );
}

function FormulaDisplay({ title, formula, calculation }: { title: string; formula: string; calculation: string }) {
  return (
    <div className="p-4 rounded-lg bg-dark-700/50 border-l-4 border-gold-500">
      <h4 className="text-sm font-medium text-dark-300 mb-2">{title}</h4>
      <p className="text-xs text-dark-500 font-mono mb-2">{formula}</p>
      <p className="text-sm text-gold-400 font-mono">{calculation}</p>
    </div>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg bg-gold-500/10 border border-gold-500/30 flex justify-between items-center">
      <span className="text-sm font-medium text-gold-300">{label}</span>
      <span className="text-lg font-bold text-gold-400 font-mono">{value}</span>
    </div>
  );
}
