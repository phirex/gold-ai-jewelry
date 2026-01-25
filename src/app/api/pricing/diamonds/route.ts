import { NextRequest, NextResponse } from "next/server";
import {
  getDiamondPrice,
  getQuickDiamondEstimate,
  calculateStonesTotal,
  type DiamondSpecs,
  type DiamondClarity,
  type DiamondColor,
  type DiamondCut,
  type DiamondShape,
  type DiamondSizeCategory,
} from "@/lib/pricing/diamonds-api";
import { z } from "zod";

// Diamond specs schema
const diamondSpecsSchema = z.object({
  carat: z.number().positive(),
  clarity: z.enum([
    "FL",
    "IF",
    "VVS1",
    "VVS2",
    "VS1",
    "VS2",
    "SI1",
    "SI2",
    "I1",
    "I2",
    "I3",
  ]),
  color: z.enum(["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"]),
  cut: z
    .enum(["Excellent", "Very Good", "Good", "Fair", "Poor"])
    .optional(),
  shape: z
    .enum([
      "round",
      "princess",
      "cushion",
      "oval",
      "emerald",
      "pear",
      "marquise",
      "radiant",
      "asscher",
      "heart",
    ])
    .optional(),
});

// Quick estimate schema
const quickEstimateSchema = z.object({
  size: z.union([
    z.enum(["tiny", "small", "medium", "large", "statement"]),
    z.number().positive(),
  ]),
  quality: z.enum(["economy", "standard", "premium", "luxury"]).optional(),
});

// Multiple stones schema
const stonesSchema = z.object({
  stones: z.array(
    z.object({
      type: z.enum(["diamond", "sapphire", "ruby", "emerald"]),
      size: z.union([
        z.enum(["tiny", "small", "medium", "large", "statement"]),
        z.number().positive(),
      ]),
      quality: z.enum(["economy", "standard", "premium", "luxury"]).optional(),
      quantity: z.number().int().positive(),
    })
  ),
});

/**
 * GET /api/pricing/diamonds
 *
 * Quick diamond price estimate with simple parameters.
 * Use query params: size (tiny|small|medium|large|statement or carat), quality
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const sizeParam = searchParams.get("size") || "small";
    const quality = (searchParams.get("quality") || "standard") as
      | "economy"
      | "standard"
      | "premium"
      | "luxury";

    // Parse size (can be category or carat number)
    let size: DiamondSizeCategory | number;
    const parsedNumber = parseFloat(sizeParam);
    if (!isNaN(parsedNumber)) {
      size = parsedNumber;
    } else {
      size = sizeParam as DiamondSizeCategory;
    }

    const price = await getQuickDiamondEstimate(size, quality);

    return NextResponse.json({
      success: true,
      price: {
        perCarat: {
          usd: price.pricePerCarat,
          ils: price.pricePerCaratILS,
        },
        total: {
          usd: price.totalPrice,
          ils: price.totalPriceILS,
        },
      },
      specs: price.specs,
      metadata: {
        source: price.source,
        timestamp: price.timestamp,
      },
    });
  } catch (error) {
    console.error("Diamond pricing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get diamond price" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pricing/diamonds
 *
 * Get detailed diamond price or calculate multiple stones.
 *
 * For single diamond with full specs:
 * { carat, clarity, color, cut?, shape? }
 *
 * For multiple stones:
 * { stones: [{ type, size, quality?, quantity }] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if it's a stones array request
    if ("stones" in body) {
      const validatedData = stonesSchema.parse(body);

      const result = await calculateStonesTotal(validatedData.stones);

      return NextResponse.json({
        success: true,
        total: {
          ils: result.totalILS,
        },
        breakdown: result.breakdown,
      });
    }

    // Check if it's a quick estimate
    if ("size" in body && !("carat" in body)) {
      const validatedData = quickEstimateSchema.parse(body);

      const price = await getQuickDiamondEstimate(
        validatedData.size as DiamondSizeCategory | number,
        validatedData.quality
      );

      return NextResponse.json({
        success: true,
        price: {
          perCarat: {
            usd: price.pricePerCarat,
            ils: price.pricePerCaratILS,
          },
          total: {
            usd: price.totalPrice,
            ils: price.totalPriceILS,
          },
        },
        specs: price.specs,
        metadata: {
          source: price.source,
          timestamp: price.timestamp,
        },
      });
    }

    // Full diamond specs request
    const validatedData = diamondSpecsSchema.parse(body);

    const specs: DiamondSpecs = {
      carat: validatedData.carat,
      clarity: validatedData.clarity as DiamondClarity,
      color: validatedData.color as DiamondColor,
      cut: validatedData.cut as DiamondCut | undefined,
      shape: validatedData.shape as DiamondShape | undefined,
    };

    const price = await getDiamondPrice(specs);

    return NextResponse.json({
      success: true,
      price: {
        perCarat: {
          usd: price.pricePerCarat,
          ils: price.pricePerCaratILS,
        },
        total: {
          usd: price.totalPrice,
          ils: price.totalPriceILS,
        },
      },
      specs: price.specs,
      metadata: {
        source: price.source,
        timestamp: price.timestamp,
      },
    });
  } catch (error) {
    console.error("Diamond pricing error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to get diamond price" },
      { status: 500 }
    );
  }
}
