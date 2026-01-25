import { NextRequest, NextResponse } from "next/server";
import {
  getMetalPricesSafe,
  refreshMetalPrices,
  getMetalPricesCacheStatus,
  DEFAULT_METAL_PRICES,
  type MetalPrices,
} from "@/lib/pricing/metals-api";

/**
 * GET /api/pricing/metals
 *
 * Returns current metal prices in ILS per gram.
 * Uses cached data when available (1 hour TTL).
 */
export async function GET() {
  try {
    const prices = await getMetalPricesSafe();
    const cacheStatus = getMetalPricesCacheStatus();

    return NextResponse.json({
      success: true,
      prices: {
        gold_24k: prices.gold_24k,
        gold_18k: prices.gold_18k,
        gold_14k: prices.gold_14k,
        silver: prices.silver,
        platinum: prices.platinum,
      },
      metadata: {
        currency: "ILS",
        unit: "gram",
        source: prices.source,
        timestamp: prices.timestamp,
        isFresh: cacheStatus.isFresh,
        remainingTtlSeconds: Math.round(cacheStatus.remainingTtlMs / 1000),
      },
    });
  } catch (error) {
    console.error("Metal prices error:", error);

    // Return fallback prices on error
    return NextResponse.json({
      success: true,
      prices: {
        gold_24k: DEFAULT_METAL_PRICES.gold_24k,
        gold_18k: DEFAULT_METAL_PRICES.gold_18k,
        gold_14k: DEFAULT_METAL_PRICES.gold_14k,
        silver: DEFAULT_METAL_PRICES.silver,
        platinum: DEFAULT_METAL_PRICES.platinum,
      },
      metadata: {
        currency: "ILS",
        unit: "gram",
        source: "fallback",
        timestamp: new Date(),
        isFresh: false,
        remainingTtlSeconds: 0,
      },
    });
  }
}

/**
 * POST /api/pricing/metals
 *
 * Force refresh metal prices (bypass cache).
 * Useful for admin/testing purposes.
 */
export async function POST(request: NextRequest) {
  try {
    // Optional: Check for admin authorization
    const authHeader = request.headers.get("authorization");
    const adminSecret = process.env.ADMIN_SECRET;

    // If admin secret is set, require authorization
    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const prices = await refreshMetalPrices();

    return NextResponse.json({
      success: true,
      prices: {
        gold_24k: prices.gold_24k,
        gold_18k: prices.gold_18k,
        gold_14k: prices.gold_14k,
        silver: prices.silver,
        platinum: prices.platinum,
      },
      metadata: {
        currency: "ILS",
        unit: "gram",
        source: prices.source,
        timestamp: prices.timestamp,
        refreshed: true,
      },
    });
  } catch (error) {
    console.error("Metal prices refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to refresh metal prices" },
      { status: 500 }
    );
  }
}

// Type exports for consumers
export type MetalPricesResponse = {
  success: true;
  prices: {
    gold_24k: number;
    gold_18k: number;
    gold_14k: number;
    silver: number;
    platinum: number;
  };
  metadata: {
    currency: string;
    unit: string;
    source: MetalPrices["source"];
    timestamp: Date;
    isFresh: boolean;
    remainingTtlSeconds: number;
  };
};
