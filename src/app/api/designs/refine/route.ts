import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFluxClient } from "@/lib/ai/flux";

const refineSchema = z.object({
  sourceImageUrl: z.string().url(),
  refinementPrompt: z.string().min(5).max(1000),
  strength: z.number().min(0.1).max(1.0).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = refineSchema.parse(body);

    const fluxClient = getFluxClient();

    if (!fluxClient.isConfigured()) {
      return NextResponse.json(
        { error: "Image generation API not configured" },
        { status: 500 }
      );
    }

    console.log("Refining image with prompt:", validated.refinementPrompt);
    console.log("Source image:", validated.sourceImageUrl);
    console.log("Strength:", validated.strength ?? 0.5);

    const refinedImageUrl = await fluxClient.refineJewelryImage(
      validated.sourceImageUrl,
      validated.refinementPrompt,
      {
        strength: validated.strength ?? 0.5,
        maxWaitMs: 90000, // 90 seconds for img2img refinement
      }
    );

    return NextResponse.json({
      success: true,
      imageUrl: refinedImageUrl,
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
