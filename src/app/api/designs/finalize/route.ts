import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNanoBananaClient, type JewelryImageContext } from "@/lib/ai/nano-banana";
import { uploadImageFromUrl, isStorageConfigured } from "@/lib/storage/supabase";

/**
 * Finalize Route - Upgrade image to Pro quality before 3D conversion
 *
 * This route takes a Flash-generated image and regenerates it using
 * Nano Banana Pro for maximum quality. Called just before 3D conversion.
 */

const finalizeSchema = z.object({
  sourceImageUrl: z.string().url(),
  originalPrompt: z.string().min(5).max(1000),
  jewelryType: z.enum(["ring", "necklace", "bracelet", "earrings"]),
  targetGender: z.enum(["man", "woman", "unisex"]),
  style: z.enum(["classic", "modern", "vintage", "minimalist", "bold"]).optional(),
  material: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = finalizeSchema.parse(body);

    const nanoBananaClient = getNanoBananaClient();

    if (!nanoBananaClient.isConfigured()) {
      return NextResponse.json(
        { error: "Image generation API not configured" },
        { status: 500 }
      );
    }

    console.log("Finalizing image with Nano Banana Pro...");
    console.log("Source image:", validated.sourceImageUrl);
    console.log("Original prompt:", validated.originalPrompt);

    // Build jewelry context for consistent style
    const jewelryContext: JewelryImageContext = {
      jewelryType: validated.jewelryType,
      targetGender: validated.targetGender,
      style: validated.style || "modern",
      material: validated.material || "gold_18k",
    };

    // Upgrade to Pro quality using source as reference
    const replicateUrl = await nanoBananaClient.upgradeToProQuality(
      validated.sourceImageUrl,
      validated.originalPrompt,
      jewelryContext,
      {
        maxWaitMs: 180000, // 3 minutes for Pro quality
        onProgress: (status) => console.log(`Finalize status: ${status}`),
      }
    );

    // Upload to Supabase for permanent storage
    let finalImageUrl = replicateUrl;
    if (isStorageConfigured()) {
      console.log("Uploading enhanced image to Supabase...");
      finalImageUrl = await uploadImageFromUrl(replicateUrl, {
        folder: `enhanced/${validated.jewelryType}`,
      });
      console.log("Enhanced image uploaded:", finalImageUrl);
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
      quality: "pro",
      message: "Image upgraded to Pro quality for 3D conversion",
    });
  } catch (error) {
    console.error("Finalize error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Finalization failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
