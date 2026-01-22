import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNanoBananaClient } from "@/lib/ai/nano-banana";
import { uploadImageFromUrl, isStorageConfigured } from "@/lib/storage/supabase";

const refineSchema = z.object({
  sourceImageUrl: z.string().url(),
  refinementPrompt: z.string().min(5).max(1000),
  // Note: strength is kept for API compatibility but Nano Banana uses reference images
  strength: z.number().min(0.1).max(1.0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = refineSchema.parse(body);

    const nanoBananaClient = getNanoBananaClient();

    if (!nanoBananaClient.isConfigured()) {
      return NextResponse.json(
        { error: "Image generation API not configured" },
        { status: 500 }
      );
    }

    console.log("Refining image with Nano Banana Flash...");
    console.log("Prompt:", validated.refinementPrompt);
    console.log("Source image:", validated.sourceImageUrl);

    // Use Nano Banana's reference-image refinement
    // The source image is passed as a reference to guide the new generation
    const replicateUrl = await nanoBananaClient.refineImage(
      validated.sourceImageUrl,
      validated.refinementPrompt,
      {
        maxWaitMs: 60000, // 60 seconds for Flash refinement
        usePro: false, // Use Flash for fast iterations
      }
    );

    // Upload to Supabase for permanent storage
    let finalImageUrl = replicateUrl;
    if (isStorageConfigured()) {
      console.log("Uploading refined image to Supabase...");
      finalImageUrl = await uploadImageFromUrl(replicateUrl, {
        folder: "refined",
      });
      console.log("Refined image uploaded:", finalImageUrl);
    }

    return NextResponse.json({
      success: true,
      imageUrl: finalImageUrl,
    });
  } catch (error) {
    console.error("Refinement error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Refinement failed";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
