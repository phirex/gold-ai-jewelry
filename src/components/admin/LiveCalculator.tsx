"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { CalculatorInput } from "./PricingDashboard";

interface LiveCalculatorProps {
  input: CalculatorInput;
  onChange: (input: Partial<CalculatorInput>) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

const JEWELRY_TYPES = [
  { value: "ring", label: "Ring", icon: "💍" },
  { value: "necklace", label: "Necklace", icon: "📿" },
  { value: "bracelet", label: "Bracelet", icon: "⌚" },
  { value: "earrings", label: "Earrings", icon: "✨" },
] as const;

const MATERIALS = [
  { value: "gold_24k", label: "24K Gold", color: "from-yellow-300 to-yellow-500" },
  { value: "gold_18k", label: "18K Gold", color: "from-yellow-400 to-yellow-600" },
  { value: "gold_14k", label: "14K Gold", color: "from-yellow-500 to-yellow-700" },
  { value: "silver", label: "Silver", color: "from-gray-300 to-gray-500" },
  { value: "platinum", label: "Platinum", color: "from-gray-200 to-gray-400" },
] as const;

const SIZES = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
] as const;

const STONE_TYPES = [
  { value: "diamond", label: "Diamond" },
  { value: "sapphire", label: "Sapphire" },
  { value: "ruby", label: "Ruby" },
  { value: "emerald", label: "Emerald" },
] as const;

const STONE_SIZES = [
  { value: "tiny", label: "Tiny (0.05ct)" },
  { value: "small", label: "Small (0.15ct)" },
  { value: "medium", label: "Medium (0.35ct)" },
  { value: "large", label: "Large (0.75ct)" },
  { value: "statement", label: "Statement (1.5ct)" },
] as const;

const STONE_QUALITIES = [
  { value: "economy", label: "Economy (SI2/J)" },
  { value: "standard", label: "Standard (VS2/H)" },
  { value: "premium", label: "Premium (VS1/F)" },
  { value: "luxury", label: "Luxury (VVS1/D)" },
] as const;

export function LiveCalculator({
  input,
  onChange,
  onCalculate,
  isCalculating,
}: LiveCalculatorProps) {
  const [showStoneForm, setShowStoneForm] = useState(false);
  const [newStone, setNewStone] = useState({
    type: "diamond" as const,
    size: "small" as const,
    quality: "standard" as const,
    quantity: 1,
  });

  const handleAddStone = () => {
    onChange({
      stones: [...input.stones, { ...newStone }],
    });
    setShowStoneForm(false);
    setNewStone({
      type: "diamond",
      size: "small",
      quality: "standard",
      quantity: 1,
    });
  };

  const handleRemoveStone = (index: number) => {
    onChange({
      stones: input.stones.filter((_, i) => i !== index),
    });
  };

  const canCalculate = input.description.length >= 10;

  return (
    <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6">
      <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Live Calculator
      </h2>

      <div className="space-y-5">
        {/* Jewelry Type */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Jewelry Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {JEWELRY_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => onChange({ jewelryType: type.value })}
                className={cn(
                  "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                  input.jewelryType === type.value
                    ? "border-gold-500 bg-gold-500/10 text-gold-400"
                    : "border-dark-600 bg-dark-700 text-dark-300 hover:border-dark-500"
                )}
              >
                <span className="mr-2">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Material */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Material
          </label>
          <div className="space-y-2">
            {MATERIALS.map((material) => (
              <button
                key={material.value}
                onClick={() => onChange({ material: material.value })}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-sm transition-all",
                  input.material === material.value
                    ? "border-gold-500 bg-gold-500/10"
                    : "border-dark-600 bg-dark-700 hover:border-dark-500"
                )}
              >
                <span className={cn(
                  "w-4 h-4 rounded-full bg-gradient-to-br",
                  material.color
                )} />
                <span className={cn(
                  "font-medium",
                  input.material === material.value ? "text-gold-400" : "text-dark-300"
                )}>
                  {material.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Size
          </label>
          <div className="flex gap-2">
            {SIZES.map((size) => (
              <button
                key={size.value}
                onClick={() => onChange({ size: size.value })}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all",
                  input.size === size.value
                    ? "border-gold-500 bg-gold-500/10 text-gold-400"
                    : "border-dark-600 bg-dark-700 text-dark-300 hover:border-dark-500"
                )}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2">
            Design Description
            <span className="text-dark-500 font-normal ml-2">
              (min 10 chars for AI estimate)
            </span>
          </label>
          <textarea
            value={input.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Describe the jewelry design for AI labor estimation..."
            rows={3}
            className={cn(
              "w-full px-4 py-3 rounded-lg border bg-dark-700 text-white placeholder-dark-500",
              "focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500",
              "transition-all resize-none",
              input.description.length < 10 ? "border-dark-600" : "border-green-500/50"
            )}
          />
          <div className="flex justify-between mt-1">
            <span className={cn(
              "text-xs",
              input.description.length < 10 ? "text-dark-500" : "text-green-500"
            )}>
              {input.description.length}/10 minimum
            </span>
            {input.description.length >= 10 && (
              <span className="text-xs text-green-500">✓ AI estimation enabled</span>
            )}
          </div>
        </div>

        {/* Stones */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-dark-300">
              Stones
            </label>
            <button
              onClick={() => setShowStoneForm(true)}
              className="text-xs text-gold-500 hover:text-gold-400 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Stone
            </button>
          </div>

          {/* Stone List */}
          {input.stones.length > 0 ? (
            <div className="space-y-2">
              {input.stones.map((stone, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-dark-700 border border-dark-600"
                >
                  <div className="text-sm">
                    <span className="text-white font-medium capitalize">{stone.type}</span>
                    <span className="text-dark-400 ml-2">
                      {stone.quantity}x {stone.size} ({stone.quality})
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveStone(index)}
                    className="text-dark-400 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-dark-500 text-center py-4 bg-dark-700/50 rounded-lg border border-dashed border-dark-600">
              No stones added
            </p>
          )}

          {/* Add Stone Form */}
          {showStoneForm && (
            <div className="mt-3 p-4 rounded-lg bg-dark-700 border border-dark-600 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Type</label>
                  <select
                    value={newStone.type}
                    onChange={(e) => setNewStone({ ...newStone, type: e.target.value as typeof newStone.type })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-500 text-white text-sm focus:outline-none focus:border-gold-500"
                  >
                    {STONE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Size</label>
                  <select
                    value={newStone.size}
                    onChange={(e) => setNewStone({ ...newStone, size: e.target.value as typeof newStone.size })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-500 text-white text-sm focus:outline-none focus:border-gold-500"
                  >
                    {STONE_SIZES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Quality</label>
                  <select
                    value={newStone.quality}
                    onChange={(e) => setNewStone({ ...newStone, quality: e.target.value as typeof newStone.quality })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-500 text-white text-sm focus:outline-none focus:border-gold-500"
                  >
                    {STONE_QUALITIES.map((q) => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={newStone.quantity}
                    onChange={(e) => setNewStone({ ...newStone, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-lg bg-dark-600 border border-dark-500 text-white text-sm focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddStone}
                  className="flex-1 px-4 py-2 bg-gold-500 text-dark-900 font-medium rounded-lg hover:bg-gold-400 transition-colors text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowStoneForm(false)}
                  className="px-4 py-2 bg-dark-600 text-dark-300 font-medium rounded-lg hover:bg-dark-500 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-lg transition-all",
            "flex items-center justify-center gap-3",
            canCalculate
              ? "bg-gradient-to-r from-gold-500 to-gold-600 text-dark-900 hover:from-gold-400 hover:to-gold-500 shadow-lg shadow-gold-500/25"
              : "bg-dark-700 text-dark-400 cursor-not-allowed"
          )}
        >
          {isCalculating ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Calculating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculate Price
            </>
          )}
        </button>
      </div>
    </div>
  );
}
