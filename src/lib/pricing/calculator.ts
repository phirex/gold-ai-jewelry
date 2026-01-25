/**
 * Jewelry Pricing Calculator
 *
 * Comprehensive pricing system that integrates:
 * - Real-time metal prices from MetalPriceAPI
 * - Diamond/gemstone prices from OpenFacet
 * - AI-powered labor estimation via Claude
 * - Configurable margins and overhead
 */

import { getMetalPricesSafe, getMaterialPrice, type MetalPrices } from "./metals-api";
import { calculateStonesTotal, type DiamondSizeCategory } from "./diamonds-api";
import { estimateLabor, quickLaborEstimate, type LaborEstimate, type ComplexityLevel } from "./labor-estimator";

// Material densities in g/cm³
export const MATERIAL_DENSITIES: Record<string, number> = {
  gold_14k: 13.2,
  gold_18k: 15.5,
  gold_24k: 19.3,
  silver: 10.5,
  platinum: 21.45,
};

// Base volumes for jewelry types (cm³)
const BASE_VOLUMES: Record<string, number> = {
  ring: 0.8,
  necklace: 3.5,
  bracelet: 2.5,
  earrings: 0.6, // Per pair
};

// Size multipliers
const SIZE_MULTIPLIERS: Record<string, number> = {
  small: 0.7,
  medium: 1.0,
  large: 1.4,
};

/**
 * Stone specification for pricing
 */
export interface Stone {
  type: "diamond" | "sapphire" | "ruby" | "emerald";
  size: DiamondSizeCategory | number;
  quality?: "economy" | "standard" | "premium" | "luxury";
  quantity: number;
}

/**
 * Input for comprehensive pricing calculation
 */
export interface PricingInput {
  material: "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum";
  jewelryType: "ring" | "necklace" | "bracelet" | "earrings";
  description: string;
  volumeCm3?: number; // Optional: if known from 3D model
  size?: "small" | "medium" | "large";
  stones?: Stone[];
  complexity?: ComplexityLevel;
  marginMultiplier?: number; // Default 2.5 for D2C
  includeAIEstimate?: boolean; // Use Claude for labor estimation
}

/**
 * Detailed price breakdown
 */
export interface PricingBreakdown {
  // Material costs
  materials: {
    weightGrams: number;
    pricePerGram: number;
    wasteFactor: number;
    subtotal: number;
  };

  // Stone costs
  stones: {
    items: Array<{
      type: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
  };

  // Labor costs
  labor: {
    hours: number;
    hourlyRate: number;
    complexity: ComplexityLevel;
    reasoning?: string;
    confidence?: number;
    subtotal: number;
  };

  // Overhead
  overhead: {
    percentage: number;
    subtotal: number;
  };

  // Final calculations
  costSubtotal: number;
  marginMultiplier: number;
  margin: number;
  total: number;

  // Price range (confidence-based)
  priceRange: {
    low: number;
    high: number;
  };

  // Metadata
  metadata: {
    currency: "ILS";
    metalPricesSource: "live" | "cached" | "fallback";
    laborSource: "ai" | "rules";
    calculatedAt: Date;
  };
}

/**
 * Legacy-compatible breakdown format
 */
export interface LegacyPricingBreakdown {
  materials: number;
  stones: number;
  labor: number;
  subtotal: number;
  margin: number;
  total: number;
  weightGrams: number;
}

/**
 * Estimate volume based on jewelry type and size
 */
export function estimateVolume(jewelryType: string, size: string = "medium"): number {
  const baseVolume = BASE_VOLUMES[jewelryType] || BASE_VOLUMES.ring;
  const multiplier = SIZE_MULTIPLIERS[size] || SIZE_MULTIPLIERS.medium;
  return baseVolume * multiplier;
}

/**
 * Calculate comprehensive price with real-time data
 */
export async function calculatePriceAdvanced(
  input: PricingInput
): Promise<PricingBreakdown> {
  const startTime = Date.now();

  // 1. Get real-time metal prices
  const metalPrices = await getMetalPricesSafe();

  // 2. Calculate material cost
  const volumeCm3 = input.volumeCm3 || estimateVolume(input.jewelryType, input.size);
  const density = MATERIAL_DENSITIES[input.material] || MATERIAL_DENSITIES.gold_18k;
  const weightGrams = volumeCm3 * density;
  const pricePerGram = getMaterialPrice(metalPrices, input.material);
  const wasteFactor = 1.15; // 15% waste/loss in manufacturing
  const materialCost = weightGrams * pricePerGram * wasteFactor;

  // 3. Calculate stone costs
  let stoneCost = 0;
  const stoneBreakdown: PricingBreakdown["stones"]["items"] = [];

  if (input.stones && input.stones.length > 0) {
    const stonesResult = await calculateStonesTotal(
      input.stones.map((s) => ({
        type: s.type,
        size: s.size,
        quality: s.quality,
        quantity: s.quantity,
      }))
    );
    stoneCost = stonesResult.totalILS;
    stoneBreakdown.push(
      ...stonesResult.breakdown.map((b) => ({
        type: b.type,
        quantity: b.quantity,
        unitPrice: b.unitPriceILS,
        total: b.totalILS,
      }))
    );
  }

  // 4. Estimate labor cost
  let laborEstimate: LaborEstimate;
  let laborSource: "ai" | "rules" = "rules";

  if (input.includeAIEstimate !== false && input.description.length >= 10) {
    try {
      laborEstimate = await estimateLabor({
        description: input.description,
        jewelryType: input.jewelryType,
        material: input.material,
        hasStones: (input.stones?.length ?? 0) > 0,
        stoneCount: input.stones?.reduce((sum, s) => sum + s.quantity, 0),
      });
      laborSource = "ai";
    } catch {
      // Fallback to quick estimate
      const quick = quickLaborEstimate(
        input.jewelryType,
        input.complexity || "moderate",
        (input.stones?.length ?? 0) > 0
      );
      laborEstimate = {
        hours: quick.hours,
        complexity: input.complexity || "moderate",
        reasoning: "Quick rule-based estimate",
        confidence: 0.6,
        factors: [],
        hourlyRateILS: quick.totalILS / quick.hours,
        totalLaborILS: quick.totalILS,
      };
    }
  } else {
    // Use quick estimate for short descriptions
    const quick = quickLaborEstimate(
      input.jewelryType,
      input.complexity || "moderate",
      (input.stones?.length ?? 0) > 0
    );
    laborEstimate = {
      hours: quick.hours,
      complexity: input.complexity || "moderate",
      reasoning: "Quick rule-based estimate",
      confidence: 0.6,
      factors: [],
      hourlyRateILS: quick.totalILS / quick.hours,
      totalLaborILS: quick.totalILS,
    };
  }

  // 5. Calculate overhead (15%)
  const overheadPercentage = 0.15;
  const subtotalBeforeOverhead = materialCost + stoneCost + laborEstimate.totalLaborILS;
  const overhead = subtotalBeforeOverhead * overheadPercentage;

  // 6. Calculate total cost and margin
  const costSubtotal = subtotalBeforeOverhead + overhead;
  const marginMultiplier = input.marginMultiplier ?? 2.5;
  const margin = costSubtotal * (marginMultiplier - 1);
  const total = costSubtotal + margin;

  // 7. Calculate price range based on confidence
  const confidenceFactor = laborEstimate.confidence || 0.7;
  const variancePercent = (1 - confidenceFactor) * 0.3; // Up to 30% variance for low confidence
  const priceRange = {
    low: Math.round(total * (1 - variancePercent)),
    high: Math.round(total * (1 + variancePercent)),
  };

  console.log(`[Calculator] Price calculated in ${Date.now() - startTime}ms`);

  return {
    materials: {
      weightGrams: Math.round(weightGrams * 100) / 100,
      pricePerGram: Math.round(pricePerGram * 100) / 100,
      wasteFactor,
      subtotal: Math.round(materialCost),
    },
    stones: {
      items: stoneBreakdown,
      subtotal: Math.round(stoneCost),
    },
    labor: {
      hours: laborEstimate.hours,
      hourlyRate: laborEstimate.hourlyRateILS,
      complexity: laborEstimate.complexity,
      reasoning: laborEstimate.reasoning,
      confidence: laborEstimate.confidence,
      subtotal: Math.round(laborEstimate.totalLaborILS),
    },
    overhead: {
      percentage: overheadPercentage * 100,
      subtotal: Math.round(overhead),
    },
    costSubtotal: Math.round(costSubtotal),
    marginMultiplier,
    margin: Math.round(margin),
    total: Math.round(total),
    priceRange,
    metadata: {
      currency: "ILS",
      metalPricesSource: metalPrices.source,
      laborSource,
      calculatedAt: new Date(),
    },
  };
}

/**
 * Legacy-compatible price calculation
 *
 * Maintains backward compatibility with existing API consumers
 */
export async function calculatePrice(input: {
  material: string;
  volumeCm3: number;
  jewelryType: string;
  complexity: string;
  stones: Stone[];
  goldPricePerGram?: number;
}): Promise<LegacyPricingBreakdown> {
  // If goldPricePerGram is provided, use simple calculation (for tests/mocks)
  if (input.goldPricePerGram) {
    return calculatePriceSimple(input as PricingInputSimple);
  }

  // Use advanced calculation
  const advanced = await calculatePriceAdvanced({
    material: input.material as PricingInput["material"],
    jewelryType: input.jewelryType as PricingInput["jewelryType"],
    volumeCm3: input.volumeCm3,
    complexity: input.complexity as ComplexityLevel,
    stones: input.stones,
    description: "", // No description for legacy API
    includeAIEstimate: false, // Skip AI for legacy calls
  });

  return {
    materials: advanced.materials.subtotal,
    stones: advanced.stones.subtotal,
    labor: advanced.labor.subtotal,
    subtotal: advanced.costSubtotal,
    margin: advanced.margin,
    total: advanced.total,
    weightGrams: advanced.materials.weightGrams,
  };
}

/**
 * Simple pricing calculation (synchronous, uses provided gold price)
 */
interface PricingInputSimple {
  material: string;
  volumeCm3: number;
  jewelryType: string;
  complexity: string;
  stones: Stone[];
  goldPricePerGram: number;
}

function calculatePriceSimple(input: PricingInputSimple): LegacyPricingBreakdown {
  // Calculate material cost
  const density = MATERIAL_DENSITIES[input.material] || MATERIAL_DENSITIES.gold_18k;
  const weightGrams = input.volumeCm3 * density;

  // Adjust gold price based on karat
  const materialPriceMultipliers: Record<string, number> = {
    gold_14k: 14 / 24,
    gold_18k: 18 / 24,
    gold_24k: 1.0,
    silver: 0.02,
    platinum: 0.8,
  };

  const multiplier = materialPriceMultipliers[input.material] || 1.0;
  const materialCostPerGram = input.goldPricePerGram * multiplier;
  const materialCost = weightGrams * materialCostPerGram * 1.15;

  // Calculate stone cost (simplified)
  const DIAMOND_PRICES: Record<string, number> = {
    tiny: 800,
    small: 2000,
    medium: 8000,
    large: 20000,
    statement: 50000,
  };

  const stoneCost = input.stones.reduce((total, stone) => {
    const sizeKey = typeof stone.size === "string" ? stone.size : "small";
    const basePrice = DIAMOND_PRICES[sizeKey] || DIAMOND_PRICES.small;
    const stoneMultiplier = stone.type === "diamond" ? 1.0 : 0.6;
    return total + basePrice * stoneMultiplier * stone.quantity;
  }, 0);

  // Calculate labor cost
  const BASE_LABOR_COSTS: Record<string, number> = {
    ring: 400,
    necklace: 600,
    bracelet: 500,
    earrings: 350,
  };

  const COMPLEXITY_MULTIPLIERS: Record<string, number> = {
    simple: 1.0,
    moderate: 1.5,
    complex: 2.0,
    master: 3.0,
  };

  const baseLabor = BASE_LABOR_COSTS[input.jewelryType] || BASE_LABOR_COSTS.ring;
  const complexityMultiplier = COMPLEXITY_MULTIPLIERS[input.complexity] || 1.5;
  const laborCost = baseLabor * complexityMultiplier;

  // Calculate totals
  const subtotal = materialCost + stoneCost + laborCost;
  const marginMultiplier = 2.5;
  const margin = subtotal * (marginMultiplier - 1);
  const total = subtotal + margin;

  return {
    materials: Math.round(materialCost),
    stones: Math.round(stoneCost),
    labor: Math.round(laborCost),
    subtotal: Math.round(subtotal),
    margin: Math.round(margin),
    total: Math.round(total),
    weightGrams: Math.round(weightGrams * 100) / 100,
  };
}

/**
 * Get current gold price (async, real-time)
 */
export async function getCurrentGoldPrice(): Promise<number> {
  const prices = await getMetalPricesSafe();
  return prices.gold_24k;
}

/**
 * Format price in ILS with proper formatting
 */
export function formatPrice(amount: number, currency: string = "ILS"): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format price range
 */
export function formatPriceRange(low: number, high: number, currency: string = "ILS"): string {
  if (low === high) {
    return formatPrice(low, currency);
  }
  return `${formatPrice(low, currency)} - ${formatPrice(high, currency)}`;
}

// Re-export types for convenience
export type { MetalPrices } from "./metals-api";
export type { LaborEstimate, ComplexityLevel } from "./labor-estimator";
export type { DiamondSizeCategory, DiamondSpecs, DiamondPrice } from "./diamonds-api";
