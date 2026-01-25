/**
 * Price Caching Layer
 *
 * In-memory cache with TTL support for pricing data.
 * Provides fallback to last known prices if API fails.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttlMs: number; // Time to live in milliseconds
}

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

class PriceCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private fallbackCache: Map<string, unknown> = new Map(); // Never expires, used when API fails

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      // Entry has expired, but keep it in fallback
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set a value in the cache with optional TTL
   */
  set<T>(key: string, data: T, options?: CacheOptions): void {
    const ttlMs = options?.ttlMs ?? DEFAULT_TTL;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };

    this.cache.set(key, entry);
    // Also store in fallback cache
    this.fallbackCache.set(key, data);
  }

  /**
   * Get fallback data (never expires, used when API fails)
   */
  getFallback<T>(key: string): T | null {
    return (this.fallbackCache.get(key) as T) ?? null;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.expiresAt;
  }

  /**
   * Check if a key exists in fallback (even if expired)
   */
  hasFallback(key: string): boolean {
    return this.fallbackCache.has(key);
  }

  /**
   * Get the timestamp when the cache entry was set
   */
  getTimestamp(key: string): Date | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }
    return new Date(entry.timestamp);
  }

  /**
   * Check if cached data is fresh (within TTL)
   */
  isFresh(key: string): boolean {
    return this.has(key);
  }

  /**
   * Get remaining TTL in milliseconds
   */
  getRemainingTtl(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return 0;

    const remaining = entry.expiresAt - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Clear a specific key from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
    // Don't delete from fallback - we want to keep last known values
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    // Don't clear fallback cache
  }

  /**
   * Clear everything including fallback
   */
  clearAll(): void {
    this.cache.clear();
    this.fallbackCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    entries: number;
    fallbackEntries: number;
    oldestEntry: Date | null;
  } {
    let oldestTimestamp: number | null = null;

    for (const [, entry] of this.cache) {
      if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    return {
      entries: this.cache.size,
      fallbackEntries: this.fallbackCache.size,
      oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
    };
  }
}

// Singleton instance for the application
export const priceCache = new PriceCache();

// Cache keys
export const CACHE_KEYS = {
  METAL_PRICES: "metal_prices",
  DIAMOND_PRICES: (specs: string) => `diamond_prices_${specs}`,
  LABOR_ESTIMATE: (hash: string) => `labor_estimate_${hash}`,
  EXCHANGE_RATE: "exchange_rate_usd_ils",
} as const;

// TTL constants
export const TTL = {
  METALS: 60 * 60 * 1000, // 1 hour
  DIAMONDS: 60 * 60 * 1000, // 1 hour
  EXCHANGE_RATE: 60 * 60 * 1000, // 1 hour
  LABOR: 24 * 60 * 60 * 1000, // 24 hours (labor estimates change less frequently)
} as const;

/**
 * Helper to get cached data with automatic fallback
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL
): Promise<{ data: T; isCached: boolean; isFallback: boolean; timestamp: Date | null }> {
  // Try to get from cache first
  const cached = priceCache.get<T>(key);
  if (cached !== null) {
    return {
      data: cached,
      isCached: true,
      isFallback: false,
      timestamp: priceCache.getTimestamp(key),
    };
  }

  // Try to fetch fresh data
  try {
    const freshData = await fetchFn();
    priceCache.set(key, freshData, { ttlMs });
    return {
      data: freshData,
      isCached: false,
      isFallback: false,
      timestamp: new Date(),
    };
  } catch (error) {
    // If fetch fails, try fallback
    const fallback = priceCache.getFallback<T>(key);
    if (fallback !== null) {
      console.warn(`[PriceCache] Using fallback for ${key} due to fetch error:`, error);
      return {
        data: fallback,
        isCached: false,
        isFallback: true,
        timestamp: null,
      };
    }

    // No fallback available, re-throw the error
    throw error;
  }
}

/**
 * Create a hash from a string (for cache keys)
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
