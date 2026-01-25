/**
 * MetalPriceAPI Integration
 *
 * Fetches real-time precious metal prices from MetalPriceAPI.
 * Returns prices in ILS (Israeli Shekel) per gram.
 *
 * API Documentation: https://metalpriceapi.com/documentation
 */

import { priceCache, CACHE_KEYS, TTL, getCachedOrFetch } from "./cache";

// API configuration
const METALPRICEAPI_BASE_URL = "https://api.metalpriceapi.com/v1";

// Metal symbols used by the API
const METAL_SYMBOLS = {
  GOLD: "XAU", // Gold (troy ounce)
  SILVER: "XAG", // Silver (troy ounce)
  PLATINUM: "XPT", // Platinum (troy ounce)
  PALLADIUM: "XPD", // Palladium (troy ounce)
} as const;

// Conversion constant: troy ounce to grams
const TROY_OUNCE_TO_GRAMS = 31.1035;

/**
 * Metal prices in ILS per gram
 */
export interface MetalPrices {
  gold_24k: number; // Pure gold price per gram in ILS
  gold_18k: number; // 18k gold price per gram in ILS
  gold_14k: number; // 14k gold price per gram in ILS
  silver: number; // Silver price per gram in ILS
  platinum: number; // Platinum price per gram in ILS
  timestamp: Date;
  source: "live" | "cached" | "fallback";
}

/**
 * Raw API response structure from MetalPriceAPI
 */
interface MetalPriceAPIResponse {
  success: boolean;
  timestamp: number;
  base: string;
  rates: {
    [key: string]: number;
  };
}

/**
 * Get the API key from environment variables
 */
function getApiKey(): string {
  const apiKey = process.env.METALPRICEAPI_KEY;
  if (!apiKey) {
    throw new Error(
      "METALPRICEAPI_KEY environment variable is not set. " +
        "Please add your MetalPriceAPI key to .env.local"
    );
  }
  return apiKey;
}

/**
 * Fetch raw metal prices from MetalPriceAPI
 */
async function fetchFromAPI(): Promise<MetalPrices> {
  const apiKey = getApiKey();

  // Request prices in ILS
  const symbols = `${METAL_SYMBOLS.GOLD},${METAL_SYMBOLS.SILVER},${METAL_SYMBOLS.PLATINUM}`;
  const url = `${METALPRICEAPI_BASE_URL}/latest?api_key=${apiKey}&base=ILS&currencies=${symbols}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    // Cache for 1 hour on the fetch level as well
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MetalPriceAPI error: ${response.status} - ${errorText}`);
  }

  const data: MetalPriceAPIResponse = await response.json();

  if (!data.success) {
    throw new Error("MetalPriceAPI returned unsuccessful response");
  }

  // The API returns rates as currency/metal (how much currency per 1 troy ounce of metal)
  // We need to convert to ILS per gram
  // Note: When base=ILS, rates show ILS per unit of each symbol

  // The API returns inverse rates when metals are in currencies field
  // So we need: ILS per gram = (1 / rate) / TROY_OUNCE_TO_GRAMS
  // Or if rate is ILS per troy ounce: ILS per gram = rate / TROY_OUNCE_TO_GRAMS

  const goldPerTroyOunce = data.rates[METAL_SYMBOLS.GOLD];
  const silverPerTroyOunce = data.rates[METAL_SYMBOLS.SILVER];
  const platinumPerTroyOunce = data.rates[METAL_SYMBOLS.PLATINUM];

  // Since base is ILS, the rates are actually 1/price (ILS per 1 unit of metal)
  // We need to invert them to get price per troy ounce, then convert to per gram
  const gold24kPerGram = 1 / goldPerTroyOunce / TROY_OUNCE_TO_GRAMS;
  const silverPerGram = 1 / silverPerTroyOunce / TROY_OUNCE_TO_GRAMS;
  const platinumPerGram = 1 / platinumPerTroyOunce / TROY_OUNCE_TO_GRAMS;

  // Calculate karat-adjusted gold prices
  // 24k = 100% gold, 18k = 75% gold, 14k = 58.3% gold
  const gold18kPerGram = gold24kPerGram * (18 / 24);
  const gold14kPerGram = gold24kPerGram * (14 / 24);

  return {
    gold_24k: Math.round(gold24kPerGram * 100) / 100,
    gold_18k: Math.round(gold18kPerGram * 100) / 100,
    gold_14k: Math.round(gold14kPerGram * 100) / 100,
    silver: Math.round(silverPerGram * 100) / 100,
    platinum: Math.round(platinumPerGram * 100) / 100,
    timestamp: new Date(data.timestamp * 1000),
    source: "live",
  };
}

/**
 * Get current metal prices with caching
 *
 * Returns cached prices if available and not expired (1 hour TTL).
 * Falls back to last known prices if API fails.
 */
export async function getMetalPrices(): Promise<MetalPrices> {
  const result = await getCachedOrFetch<MetalPrices>(
    CACHE_KEYS.METAL_PRICES,
    fetchFromAPI,
    TTL.METALS
  );

  return {
    ...result.data,
    source: result.isFallback ? "fallback" : result.isCached ? "cached" : "live",
    timestamp: result.timestamp ?? result.data.timestamp,
  };
}

/**
 * Force refresh metal prices (bypass cache)
 */
export async function refreshMetalPrices(): Promise<MetalPrices> {
  priceCache.delete(CACHE_KEYS.METAL_PRICES);
  return getMetalPrices();
}

/**
 * Get the price for a specific material
 */
export function getMaterialPrice(
  prices: MetalPrices,
  material: "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum"
): number {
  const priceMap: Record<string, number> = {
    gold_14k: prices.gold_14k,
    gold_18k: prices.gold_18k,
    gold_24k: prices.gold_24k,
    silver: prices.silver,
    platinum: prices.platinum,
  };

  return priceMap[material] ?? prices.gold_18k;
}

/**
 * Check if we have any metal prices available (cached or fallback)
 */
export function hasMetalPrices(): boolean {
  return (
    priceCache.has(CACHE_KEYS.METAL_PRICES) ||
    priceCache.hasFallback(CACHE_KEYS.METAL_PRICES)
  );
}

/**
 * Get cache status for metal prices
 */
export function getMetalPricesCacheStatus(): {
  isCached: boolean;
  isFresh: boolean;
  lastUpdated: Date | null;
  remainingTtlMs: number;
} {
  return {
    isCached: priceCache.has(CACHE_KEYS.METAL_PRICES),
    isFresh: priceCache.isFresh(CACHE_KEYS.METAL_PRICES),
    lastUpdated: priceCache.getTimestamp(CACHE_KEYS.METAL_PRICES),
    remainingTtlMs: priceCache.getRemainingTtl(CACHE_KEYS.METAL_PRICES),
  };
}

// Default/fallback prices (based on approximate market rates as of 2024)
// These are used if the API is not configured or fails without cached data
export const DEFAULT_METAL_PRICES: MetalPrices = {
  gold_24k: 280, // ~$75/g at 3.7 ILS/USD
  gold_18k: 210, // 75% of 24k
  gold_14k: 163, // 58.3% of 24k
  silver: 3.5, // ~$0.95/g at 3.7 ILS/USD
  platinum: 115, // ~$31/g at 3.7 ILS/USD
  timestamp: new Date(),
  source: "fallback",
};

/**
 * Get metal prices with graceful fallback to defaults
 *
 * This function never throws - it returns default prices if all else fails.
 */
export async function getMetalPricesSafe(): Promise<MetalPrices> {
  try {
    return await getMetalPrices();
  } catch (error) {
    console.error("[MetalPrices] Failed to fetch prices, using defaults:", error);
    return DEFAULT_METAL_PRICES;
  }
}
