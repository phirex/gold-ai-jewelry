/**
 * Jewelry Pricing Calculator
 *
 * Calculates prices based on:
 * - Material cost (weight × gold price)
 * - Stone cost (diamonds, gems)
 * - Labor cost (complexity-based)
 * - Margin
 */

// Material densities in g/cm³
export const MATERIAL_DENSITIES: Record<string, number> = {
  gold_14k: 13.2,
  gold_18k: 15.5,
  gold_24k: 19.3,
  silver: 10.5,
  platinum: 21.45,
};

// Base labor costs by jewelry type (in ILS)
export const BASE_LABOR_COSTS: Record<string, number> = {
  ring: 400,
  necklace: 600,
  bracelet: 500,
  earrings: 350,
};

// Complexity multipliers
export const COMPLEXITY_MULTIPLIERS: Record<string, number> = {
  simple: 1.0,
  moderate: 1.5,
  complex: 2.0,
};

// Stone price tiers (per carat in ILS) - simplified
export const DIAMOND_PRICES: Record<string, number> = {
  small: 2000, // 0.1-0.3 carat
  medium: 8000, // 0.3-0.5 carat
  large: 20000, // 0.5-1.0 carat
};

export interface Stone {
  type: "diamond" | "sapphire" | "ruby" | "emerald";
  size: "small" | "medium" | "large";
  quantity: number;
}

export interface PricingInput {
  material: string;
  volumeCm3: number;
  jewelryType: string;
  complexity: string;
  stones: Stone[];
  goldPricePerGram: number; // Current market price for 24k gold in ILS
}

export interface PricingBreakdown {
  materials: number;
  stones: number;
  labor: number;
  subtotal: number;
  margin: number;
  total: number;
  weightGrams: number;
}

/**
 * Calculate the full price breakdown for a jewelry piece
 */
export function calculatePrice(input: PricingInput): PricingBreakdown {
  // Calculate material cost
  const density = MATERIAL_DENSITIES[input.material] || MATERIAL_DENSITIES.gold_18k;
  const weightGrams = input.volumeCm3 * density;

  // Adjust gold price based on karat
  const materialPriceMultipliers: Record<string, number> = {
    gold_14k: 14 / 24,
    gold_18k: 18 / 24,
    gold_24k: 1.0,
    silver: 0.02, // Silver is much cheaper than gold
    platinum: 0.8, // Platinum is typically cheaper than gold per gram
  };

  const multiplier = materialPriceMultipliers[input.material] || 1.0;
  const materialCostPerGram = input.goldPricePerGram * multiplier;
  const materialCost = weightGrams * materialCostPerGram * 1.15; // +15% for waste/loss

  // Calculate stone cost
  const stoneCost = input.stones.reduce((total, stone) => {
    const basePrice = DIAMOND_PRICES[stone.size] || DIAMOND_PRICES.small;
    // Other stones are typically cheaper than diamonds
    const stoneMultiplier = stone.type === "diamond" ? 1.0 : 0.6;
    return total + basePrice * stoneMultiplier * stone.quantity;
  }, 0);

  // Calculate labor cost
  const baseLabor = BASE_LABOR_COSTS[input.jewelryType] || BASE_LABOR_COSTS.ring;
  const complexityMultiplier =
    COMPLEXITY_MULTIPLIERS[input.complexity] || COMPLEXITY_MULTIPLIERS.moderate;
  const laborCost = baseLabor * complexityMultiplier;

  // Calculate subtotal and margin
  const subtotal = materialCost + stoneCost + laborCost;
  const marginMultiplier = 3.0; // 3x markup for D2C
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
 * Get current gold price (mock - should fetch from API)
 */
export async function getCurrentGoldPrice(): Promise<number> {
  // TODO: Implement actual API call to Metals-API
  // For now, return a realistic mock price (ILS per gram for 24k)
  // As of 2024, gold is roughly $60-70 USD per gram
  // At ~3.7 ILS/USD, that's around 220-260 ILS per gram
  return 240; // ILS per gram for 24k gold
}

/**
 * Estimate volume from jewelry type (mock - should use actual 3D model calculation)
 */
export function estimateVolume(jewelryType: string, size: string = "medium"): number {
  // Approximate volumes in cm³ for different jewelry types
  const baseVolumes: Record<string, number> = {
    ring: 0.8,
    necklace: 3.5,
    bracelet: 2.5,
    earrings: 0.6, // Per pair
  };

  const sizeMultipliers: Record<string, number> = {
    small: 0.7,
    medium: 1.0,
    large: 1.4,
  };

  const baseVolume = baseVolumes[jewelryType] || baseVolumes.ring;
  const multiplier = sizeMultipliers[size] || sizeMultipliers.medium;

  return baseVolume * multiplier;
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
