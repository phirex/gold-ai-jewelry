import { NextRequest, NextResponse } from "next/server";
import {
  calculatePrice,
  getCurrentGoldPrice,
  estimateVolume,
  type Stone,
} from "@/lib/pricing/calculator";
import { z } from "zod";

const stoneSchema = z.object({
  type: z.enum(["diamond", "sapphire", "ruby", "emerald"]),
  size: z.enum(["small", "medium", "large"]),
  quantity: z.number().int().positive(),
});

const estimateSchema = z.object({
  material: z.enum(["gold_14k", "gold_18k", "gold_24k", "silver", "platinum"]),
  jewelryType: z.enum(["ring", "necklace", "bracelet", "earrings"]),
  complexity: z.enum(["simple", "moderate", "complex"]).optional(),
  volumeCm3: z.number().positive().optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  stones: z.array(stoneSchema).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = estimateSchema.parse(body);

    // Get current gold price
    const goldPricePerGram = await getCurrentGoldPrice();

    // Calculate or estimate volume
    const volumeCm3 =
      validatedData.volumeCm3 ||
      estimateVolume(validatedData.jewelryType, validatedData.size);

    // Calculate price
    const breakdown = calculatePrice({
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

// GET endpoint for quick estimates with query params
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const material = searchParams.get("material") || "gold_18k";
    const jewelryType = searchParams.get("type") || "ring";
    const complexity = searchParams.get("complexity") || "moderate";
    const size = searchParams.get("size") || "medium";

    // Get current gold price
    const goldPricePerGram = await getCurrentGoldPrice();

    // Estimate volume based on type and size
    const volumeCm3 = estimateVolume(jewelryType, size);

    // Calculate price
    const breakdown = calculatePrice({
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
    });
  } catch (error) {
    console.error("Pricing error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate price" },
      { status: 500 }
    );
  }
}
