import { NextRequest, NextResponse } from "next/server";
import {
  calculatePriceAdvanced,
  calculatePrice,
  getCurrentGoldPrice,
  estimateVolume,
  type Stone,
  type PricingBreakdown,
} from "@/lib/pricing/calculator";
import { getMetalPricesSafe, getMetalPricesCacheStatus } from "@/lib/pricing/metals-api";
import { z } from "zod";

// Stone schema for validation
const stoneSchema = z.object({
  type: z.enum(["diamond", "sapphire", "ruby", "emerald"]),
  size: z.union([
    z.enum(["tiny", "small", "medium", "large", "statement"]),
    z.number().positive(),
  ]),
  quality: z.enum(["economy", "standard", "premium", "luxury"]).optional(),
  quantity: z.number().int().positive(),
});

// Advanced estimate request schema
const advancedEstimateSchema = z.object({
  material: z.enum(["gold_14k", "gold_18k", "gold_24k", "silver", "platinum"]),
  jewelryType: z.enum(["ring", "necklace", "bracelet", "earrings"]),
  description: z.string().min(1),
  volumeCm3: z.number().positive().optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  stones: z.array(stoneSchema).optional(),
  complexity: z.enum(["simple", "moderate", "complex", "master"]).optional(),
  marginMultiplier: z.number().positive().optional(),
  includeAIEstimate: z.boolean().optional(),
});

// Legacy estimate schema
const legacyEstimateSchema = z.object({
  material: z.enum(["gold_14k", "gold_18k", "gold_24k", "silver", "platinum"]),
  jewelryType: z.enum(["ring", "necklace", "bracelet", "earrings"]),
  complexity: z.enum(["simple", "moderate", "complex", "master"]).optional(),
  volumeCm3: z.number().positive().optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  stones: z.array(stoneSchema).optional(),
});

/**
 * POST /api/pricing/estimate
 *
 * Advanced pricing estimation with real-time metal prices,
 * diamond pricing, and AI-powered labor estimation.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is an advanced request (has description) or legacy
    const isAdvanced = "description" in body && body.description?.length > 0;

    if (isAdvanced) {
      // Advanced pricing with AI estimation
      const validatedData = advancedEstimateSchema.parse(body);

      const breakdown = await calculatePriceAdvanced({
        material: validatedData.material,
        jewelryType: validatedData.jewelryType,
        description: validatedData.description,
        volumeCm3: validatedData.volumeCm3,
        size: validatedData.size,
        stones: validatedData.stones as Stone[] | undefined,
        complexity: validatedData.complexity,
        marginMultiplier: validatedData.marginMultiplier,
        includeAIEstimate: validatedData.includeAIEstimate ?? true,
      });

      return NextResponse.json({
        success: true,
        breakdown,
        summary: {
          total: breakdown.total,
          range: breakdown.priceRange,
          currency: "ILS",
        },
      });
    } else {
      // Legacy pricing
      const validatedData = legacyEstimateSchema.parse(body);

      const goldPricePerGram = await getCurrentGoldPrice();
      const volumeCm3 =
        validatedData.volumeCm3 ||
        estimateVolume(validatedData.jewelryType, validatedData.size);

      const breakdown = await calculatePrice({
        material: validatedData.material,
        volumeCm3,
        jewelryType: validatedData.jewelryType,
        complexity: validatedData.complexity || "moderate",
        stones: (validatedData.stones as Stone[]) || [],
        goldPricePerGram,
      });

      return NextResponse.json({
        success: true,
        breakdown,
        goldPricePerGram,
        currency: "ILS",
      });
    }
  } catch (error) {
    console.error("Pricing error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pricing/estimate
 *
 * Quick estimates with query parameters for real-time UI updates.
 * Returns both legacy format and enhanced data.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const material = (searchParams.get("material") || "gold_18k") as
      | "gold_14k"
      | "gold_18k"
      | "gold_24k"
      | "silver"
      | "platinum";
    const jewelryType = (searchParams.get("type") || "ring") as
      | "ring"
      | "necklace"
      | "bracelet"
      | "earrings";
    const complexity = (searchParams.get("complexity") || "moderate") as
      | "simple"
      | "moderate"
      | "complex"
      | "master";
    const size = (searchParams.get("size") || "medium") as "small" | "medium" | "large";
    const description = searchParams.get("description") || "";

    // Get current metal prices and cache status
    const metalPrices = await getMetalPricesSafe();
    const cacheStatus = getMetalPricesCacheStatus();

    // Calculate volume estimate
    const volumeCm3 = estimateVolume(jewelryType, size);

    // If description provided, use advanced calculation
    if (description.length >= 10) {
      const breakdown = await calculatePriceAdvanced({
        material,
        jewelryType,
        description,
        volumeCm3,
        size,
        complexity,
        includeAIEstimate: true,
      });

      return NextResponse.json({
        success: true,
        breakdown,
        summary: {
          total: breakdown.total,
          range: breakdown.priceRange,
          currency: "ILS",
        },
        marketData: {
          metalPrices: {
            gold_24k: metalPrices.gold_24k,
            gold_18k: metalPrices.gold_18k,
            gold_14k: metalPrices.gold_14k,
            silver: metalPrices.silver,
            platinum: metalPrices.platinum,
          },
          source: metalPrices.source,
          lastUpdated: metalPrices.timestamp,
          isFresh: cacheStatus.isFresh,
        },
      });
    }

    // Quick estimate without AI
    const goldPricePerGram = metalPrices.gold_24k;

    const breakdown = await calculatePrice({
      material,
      volumeCm3,
      jewelryType,
      complexity,
      stones: [],
      goldPricePerGram,
    });

    return NextResponse.json({
      success: true,
      breakdown,
      goldPricePerGram,
      currency: "ILS",
      marketData: {
        metalPrices: {
          gold_24k: metalPrices.gold_24k,
          gold_18k: metalPrices.gold_18k,
          gold_14k: metalPrices.gold_14k,
          silver: metalPrices.silver,
          platinum: metalPrices.platinum,
        },
        source: metalPrices.source,
        lastUpdated: metalPrices.timestamp,
        isFresh: cacheStatus.isFresh,
      },
    });
  } catch (error) {
    console.error("Pricing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}

// Type guard for response
export type EstimateResponse =
  | {
      success: true;
      breakdown: PricingBreakdown;
      summary: {
        total: number;
        range: { low: number; high: number };
        currency: string;
      };
      marketData?: {
        metalPrices: {
          gold_24k: number;
          gold_18k: number;
          gold_14k: number;
          silver: number;
          platinum: number;
        };
        source: string;
        lastUpdated: Date;
        isFresh: boolean;
      };
    }
  | {
      success: false;
      error: string;
      details?: unknown;
    };
