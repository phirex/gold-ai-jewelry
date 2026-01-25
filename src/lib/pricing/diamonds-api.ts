/**
 * OpenFacet Diamond Pricing Integration
 *
 * Fetches GIA-certified diamond prices from the OpenFacet API.
 * Documentation: https://openfacet.net/en/api-docs
 *
 * OpenFacet provides free, real-time access to diamond pricing data.
 */

import { priceCache, CACHE_KEYS, TTL, getCachedOrFetch } from "./cache";

// OpenFacet API base URL
const OPENFACET_BASE_URL = "https://openfacet.net/api/v1";

// Diamond clarity grades (GIA scale)
export type DiamondClarity =
  | "FL" // Flawless
  | "IF" // Internally Flawless
  | "VVS1" // Very Very Slightly Included 1
  | "VVS2" // Very Very Slightly Included 2
  | "VS1" // Very Slightly Included 1
  | "VS2" // Very Slightly Included 2
  | "SI1" // Slightly Included 1
  | "SI2" // Slightly Included 2
  | "I1" // Included 1
  | "I2" // Included 2
  | "I3"; // Included 3

// Diamond color grades (GIA scale, D-Z where D is colorless)
export type DiamondColor =
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M";

// Diamond cut grades
export type DiamondCut =
  | "Excellent"
  | "Very Good"
  | "Good"
  | "Fair"
  | "Poor";

// Diamond shapes
export type DiamondShape =
  | "round"
  | "princess"
  | "cushion"
  | "oval"
  | "emerald"
  | "pear"
  | "marquise"
  | "radiant"
  | "asscher"
  | "heart";

/**
 * Diamond specifications for pricing lookup
 */
export interface DiamondSpecs {
  carat: number;
  clarity: DiamondClarity;
  color: DiamondColor;
  cut?: DiamondCut;
  shape?: DiamondShape;
}

/**
 * Diamond price result
 */
export interface DiamondPrice {
  pricePerCarat: number; // USD per carat
  pricePerCaratILS: number; // ILS per carat
  totalPrice: number; // Total price in USD
  totalPriceILS: number; // Total price in ILS
  specs: DiamondSpecs;
  source: "live" | "cached" | "fallback" | "matrix";
  timestamp: Date;
}

/**
 * OpenFacet API response structure
 */
interface OpenFacetPriceResponse {
  success: boolean;
  data: {
    price_per_carat: number;
    currency: string;
  };
}

/**
 * Exchange rate for USD to ILS conversion
 */
let cachedExchangeRate: number | null = null;
let exchangeRateTimestamp: number = 0;

async function getUsdToIlsRate(): Promise<number> {
  const now = Date.now();
  // Cache exchange rate for 1 hour
  if (cachedExchangeRate && now - exchangeRateTimestamp < TTL.EXCHANGE_RATE) {
    return cachedExchangeRate;
  }

  try {
    // Try to get from a free exchange rate API
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD",
      { next: { revalidate: 3600 } }
    );

    if (response.ok) {
      const data = await response.json();
      const rate = data.rates?.ILS ?? 3.7;
      cachedExchangeRate = rate;
      exchangeRateTimestamp = now;
      return rate;
    }
  } catch {
    console.warn("[DiamondAPI] Failed to fetch exchange rate, using default");
  }

  // Default fallback rate
  return 3.7;
}

/**
 * Diamond price matrix based on GIA standards
 *
 * This is a simplified matrix for common diamond grades.
 * Prices are approximate USD per carat for 1-carat reference.
 * Actual prices vary based on many factors.
 */
const DIAMOND_PRICE_MATRIX: Record<DiamondClarity, Record<DiamondColor, number>> = {
  FL: { D: 25000, E: 20000, F: 17000, G: 14000, H: 11000, I: 9000, J: 7500, K: 6000, L: 5000, M: 4000 },
  IF: { D: 18000, E: 15000, F: 13000, G: 11000, H: 9000, I: 7500, J: 6000, K: 5000, L: 4200, M: 3500 },
  VVS1: { D: 14000, E: 12000, F: 10000, G: 8500, H: 7000, I: 6000, J: 5000, K: 4200, L: 3500, M: 3000 },
  VVS2: { D: 11000, E: 9500, F: 8000, G: 7000, H: 6000, I: 5000, J: 4200, K: 3500, L: 3000, M: 2600 },
  VS1: { D: 9000, E: 7800, F: 6800, G: 5800, H: 5000, I: 4200, J: 3500, K: 3000, L: 2600, M: 2200 },
  VS2: { D: 7500, E: 6500, F: 5700, G: 5000, H: 4300, I: 3700, J: 3100, K: 2700, L: 2300, M: 2000 },
  SI1: { D: 5500, E: 4800, F: 4200, G: 3800, H: 3300, I: 2900, J: 2500, K: 2200, L: 1900, M: 1700 },
  SI2: { D: 4200, E: 3700, F: 3300, G: 3000, H: 2600, I: 2300, J: 2000, K: 1800, L: 1600, M: 1400 },
  I1: { D: 2500, E: 2200, F: 2000, G: 1800, H: 1600, I: 1400, J: 1250, K: 1100, L: 1000, M: 900 },
  I2: { D: 1500, E: 1350, F: 1200, G: 1100, H: 1000, I: 900, J: 800, K: 700, L: 650, M: 600 },
  I3: { D: 1000, E: 900, F: 800, G: 750, H: 700, I: 650, J: 600, K: 550, L: 500, M: 450 },
};

/**
 * Size multiplier for carat weight
 * Larger diamonds command a premium per carat
 */
function getSizeMultiplier(carat: number): number {
  if (carat < 0.3) return 0.7;
  if (carat < 0.5) return 0.85;
  if (carat < 0.7) return 0.95;
  if (carat < 1.0) return 1.0;
  if (carat < 1.5) return 1.15;
  if (carat < 2.0) return 1.35;
  if (carat < 3.0) return 1.6;
  if (carat < 4.0) return 1.9;
  return 2.2; // 4+ carats
}

/**
 * Cut quality multiplier
 */
function getCutMultiplier(cut?: DiamondCut): number {
  if (!cut) return 1.0;
  const multipliers: Record<DiamondCut, number> = {
    Excellent: 1.15,
    "Very Good": 1.05,
    Good: 1.0,
    Fair: 0.9,
    Poor: 0.75,
  };
  return multipliers[cut] ?? 1.0;
}

/**
 * Shape premium/discount
 * Round brilliants typically command a premium
 */
function getShapeMultiplier(shape?: DiamondShape): number {
  if (!shape) return 1.0;
  const multipliers: Record<DiamondShape, number> = {
    round: 1.0, // Round is the reference
    princess: 0.85,
    cushion: 0.88,
    oval: 0.90,
    emerald: 0.82,
    pear: 0.85,
    marquise: 0.80,
    radiant: 0.85,
    asscher: 0.82,
    heart: 0.78,
  };
  return multipliers[shape] ?? 1.0;
}

/**
 * Fetch diamond price from OpenFacet API
 */
async function fetchFromOpenFacet(specs: DiamondSpecs): Promise<DiamondPrice> {
  const exchangeRate = await getUsdToIlsRate();

  try {
    // Construct the API query
    const params = new URLSearchParams({
      carat: specs.carat.toString(),
      clarity: specs.clarity,
      color: specs.color,
      ...(specs.cut && { cut: specs.cut }),
      ...(specs.shape && { shape: specs.shape }),
    });

    const response = await fetch(`${OPENFACET_BASE_URL}/price?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data: OpenFacetPriceResponse = await response.json();

      if (data.success && data.data.price_per_carat) {
        const pricePerCarat = data.data.price_per_carat;
        const totalPrice = pricePerCarat * specs.carat;

        return {
          pricePerCarat,
          pricePerCaratILS: Math.round(pricePerCarat * exchangeRate),
          totalPrice,
          totalPriceILS: Math.round(totalPrice * exchangeRate),
          specs,
          source: "live",
          timestamp: new Date(),
        };
      }
    }
  } catch (error) {
    console.warn("[DiamondAPI] OpenFacet API unavailable, using price matrix:", error);
  }

  // Fallback to price matrix
  return calculateFromMatrix(specs, exchangeRate);
}

/**
 * Calculate diamond price from the local price matrix
 */
function calculateFromMatrix(
  specs: DiamondSpecs,
  exchangeRate: number
): DiamondPrice {
  // Get base price from matrix
  const clarityPrices = DIAMOND_PRICE_MATRIX[specs.clarity];
  const basePrice = clarityPrices?.[specs.color] ?? 5000; // Default if grade not found

  // Apply multipliers
  const sizeMultiplier = getSizeMultiplier(specs.carat);
  const cutMultiplier = getCutMultiplier(specs.cut);
  const shapeMultiplier = getShapeMultiplier(specs.shape);

  const pricePerCarat = Math.round(
    basePrice * sizeMultiplier * cutMultiplier * shapeMultiplier
  );
  const totalPrice = Math.round(pricePerCarat * specs.carat);

  return {
    pricePerCarat,
    pricePerCaratILS: Math.round(pricePerCarat * exchangeRate),
    totalPrice,
    totalPriceILS: Math.round(totalPrice * exchangeRate),
    specs,
    source: "matrix",
    timestamp: new Date(),
  };
}

/**
 * Get diamond price with caching
 */
export async function getDiamondPrice(specs: DiamondSpecs): Promise<DiamondPrice> {
  // Create a cache key based on specs
  const specsKey = `${specs.carat}_${specs.clarity}_${specs.color}_${specs.cut ?? "none"}_${specs.shape ?? "round"}`;
  const cacheKey = CACHE_KEYS.DIAMOND_PRICES(specsKey);

  const result = await getCachedOrFetch<DiamondPrice>(
    cacheKey,
    () => fetchFromOpenFacet(specs),
    TTL.DIAMONDS
  );

  return {
    ...result.data,
    source: result.isFallback
      ? "fallback"
      : result.isCached
        ? "cached"
        : result.data.source,
    timestamp: result.timestamp ?? result.data.timestamp,
  };
}

/**
 * Simplified size categories for jewelry design
 */
export type DiamondSizeCategory = "tiny" | "small" | "medium" | "large" | "statement";

/**
 * Convert size category to approximate carat weight
 */
export function sizeToCaratEstimate(size: DiamondSizeCategory): number {
  const estimates: Record<DiamondSizeCategory, number> = {
    tiny: 0.05, // Accent stones
    small: 0.15, // Small accent/side stones
    medium: 0.35, // Medium stones
    large: 0.75, // Main/center stones
    statement: 1.5, // Statement pieces
  };
  return estimates[size];
}

/**
 * Get a quick price estimate for jewelry design purposes
 *
 * Uses common defaults for jewelry-grade diamonds
 */
export async function getQuickDiamondEstimate(
  size: DiamondSizeCategory | number,
  quality: "economy" | "standard" | "premium" | "luxury" = "standard"
): Promise<DiamondPrice> {
  const carat = typeof size === "number" ? size : sizeToCaratEstimate(size);

  // Map quality to clarity/color
  const qualitySpecs: Record<string, { clarity: DiamondClarity; color: DiamondColor }> = {
    economy: { clarity: "SI2", color: "J" },
    standard: { clarity: "VS2", color: "H" },
    premium: { clarity: "VS1", color: "F" },
    luxury: { clarity: "VVS1", color: "D" },
  };

  const { clarity, color } = qualitySpecs[quality];

  return getDiamondPrice({
    carat,
    clarity,
    color,
    cut: quality === "luxury" ? "Excellent" : quality === "premium" ? "Very Good" : "Good",
    shape: "round",
  });
}

/**
 * Calculate total cost for multiple stones
 */
export async function calculateStonesTotal(
  stones: Array<{
    type: "diamond" | "sapphire" | "ruby" | "emerald";
    size: DiamondSizeCategory | number;
    quality?: "economy" | "standard" | "premium" | "luxury";
    quantity: number;
  }>
): Promise<{
  totalILS: number;
  breakdown: Array<{
    type: string;
    quantity: number;
    unitPriceILS: number;
    totalILS: number;
  }>;
}> {
  const breakdown: Array<{
    type: string;
    quantity: number;
    unitPriceILS: number;
    totalILS: number;
  }> = [];

  let total = 0;

  for (const stone of stones) {
    let unitPrice: number;

    if (stone.type === "diamond") {
      const diamondPrice = await getQuickDiamondEstimate(stone.size, stone.quality);
      unitPrice = diamondPrice.totalPriceILS;
    } else {
      // For other gemstones, use a simplified pricing model
      // (typically 30-70% of equivalent diamond price)
      const diamondPrice = await getQuickDiamondEstimate(stone.size, stone.quality);
      const gemMultipliers: Record<string, number> = {
        sapphire: 0.6,
        ruby: 0.7,
        emerald: 0.65,
      };
      unitPrice = Math.round(diamondPrice.totalPriceILS * (gemMultipliers[stone.type] ?? 0.5));
    }

    const stoneTotal = unitPrice * stone.quantity;
    total += stoneTotal;

    breakdown.push({
      type: stone.type,
      quantity: stone.quantity,
      unitPriceILS: unitPrice,
      totalILS: stoneTotal,
    });
  }

  return {
    totalILS: Math.round(total),
    breakdown,
  };
}
