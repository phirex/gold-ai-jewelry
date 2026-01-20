import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFluxClient, JewelryImageContext } from "@/lib/ai/flux";

const requestSchema = z.object({
  prompt: z.string().min(10),
  jewelryType: z.enum(["ring", "necklace", "bracelet", "earrings"]),
  gender: z.enum(["man", "woman", "unisex"]),
  material: z.string().default("gold_18k"),
  count: z.number().min(1).max(4).default(4),
});

// Helper to generate placeholder URL
function getPlaceholderUrl(jewelryType: string, variant: number): string {
  return `/api/placeholder/jewelry?type=${jewelryType}&variant=${variant}`;
}

// Helper to delay between requests to avoid rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = requestSchema.parse(body);

    const fluxClient = getFluxClient();

    // If Flux is not configured, return placeholder images immediately
    if (!fluxClient.isConfigured()) {
      const placeholderImages = Array(validated.count)
        .fill(null)
        .map((_, i) => getPlaceholderUrl(validated.jewelryType, i));

      return NextResponse.json({ images: placeholderImages });
    }

    const jewelryContext: JewelryImageContext = {
      jewelryType: validated.jewelryType,
      targetGender: validated.gender,
      style: "modern",
      material: validated.material,
    };

    // Variation prompts for diversity
    const variationPrompts = [
      validated.prompt,
      `${validated.prompt}, with elegant details`,
      `${validated.prompt}, refined and sophisticated`,
      `${validated.prompt}, with unique artistic touches`,
    ];

    // Generate images sequentially with small delays to avoid rate limiting
    const images: string[] = [];

    for (let i = 0; i < validated.count; i++) {
      const variantPrompt = variationPrompts[i % variationPrompts.length];

      try {
        // Add delay between requests (except for first one)
        if (i > 0) {
          await delay(500);
        }

        const imageUrl = await fluxClient.generateJewelryImage(
          variantPrompt,
          jewelryContext,
          {
            aspectRatio: "1:1",
            outputFormat: "png",
            outputQuality: 95,
          }
        );
        images.push(imageUrl);
      } catch (error) {
        console.error(`Failed to generate variation ${i}:`, error);
        // Use placeholder as fallback for failed generations
        images.push(getPlaceholderUrl(validated.jewelryType, i));
      }
    }

    // Ensure we always return the requested count
    while (images.length < validated.count) {
      images.push(getPlaceholderUrl(validated.jewelryType, images.length));
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Generate variations error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    // Even on error, return placeholder images so the UI doesn't break
    const placeholderImages = Array(4)
      .fill(null)
      .map((_, i) => getPlaceholderUrl("ring", i));

    return NextResponse.json({ images: placeholderImages });
  }
}
