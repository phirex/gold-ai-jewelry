import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getNanoBananaClient, JewelryImageContext } from "@/lib/ai/nano-banana";
import { uploadImageFromUrl, isStorageConfigured } from "@/lib/storage/supabase";

const requestSchema = z.object({
  prompt: z.string().min(10),
  jewelryType: z.enum(["ring", "necklace", "bracelet", "earrings"]),
  gender: z.enum(["man", "woman", "unisex"]),
  material: z.string().default("gold_18k"),
  count: z.number().min(1).max(4).default(2),
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

    const nanoBananaClient = getNanoBananaClient();

    // If Nano Banana is not configured, return placeholder images immediately
    if (!nanoBananaClient.isConfigured()) {
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

    // Variation prompts for meaningful diversity between the 2 images
    const variationPrompts = [
      // First variation: emphasize classic elegance and polish
      `${validated.prompt}, classic elegant interpretation with smooth polished surfaces and refined proportions`,
      // Second variation: emphasize modern details and texture
      `${validated.prompt}, modern interpretation with subtle textured details and contemporary styling`,
      // Backup variations if more than 2 requested
      `${validated.prompt}, with intricate decorative elements`,
      `${validated.prompt}, minimalist clean design`,
    ];

    // Generate images sequentially with delays to avoid rate limiting
    // Nano Banana Flash is faster, but we still need some delay for rate limits
    const images: string[] = [];
    const DELAY_BETWEEN_REQUESTS = 3000; // 3 seconds between requests (Flash is faster)
    const storageEnabled = isStorageConfigured();

    for (let i = 0; i < validated.count; i++) {
      const variantPrompt = variationPrompts[i % variationPrompts.length];

      try {
        // Add delay between requests (except for first one)
        if (i > 0) {
          console.log(`Waiting ${DELAY_BETWEEN_REQUESTS}ms before generating image ${i + 1}...`);
          await delay(DELAY_BETWEEN_REQUESTS);
        }

        console.log(`Generating image ${i + 1}/${validated.count} with Nano Banana Flash...`);
        const replicateUrl = await nanoBananaClient.generateDraft(
          variantPrompt,
          jewelryContext,
          {
            aspectRatio: "1:1",
            outputFormat: "png",
          },
          {
            maxWaitMs: 30000, // 30 seconds for Flash
            pollIntervalMs: 2000,
          }
        );
        console.log(`Image ${i + 1} generated successfully: ${replicateUrl}`);

        // Upload to Supabase for permanent storage
        let finalUrl = replicateUrl;
        if (storageEnabled) {
          console.log(`Uploading image ${i + 1} to Supabase...`);
          finalUrl = await uploadImageFromUrl(replicateUrl, {
            folder: `drafts/${validated.jewelryType}`,
          });
          console.log(`Image ${i + 1} uploaded to Supabase: ${finalUrl}`);
        }

        images.push(finalUrl);
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
    const placeholderImages = Array(2)
      .fill(null)
      .map((_, i) => getPlaceholderUrl("ring", i));

    return NextResponse.json({ images: placeholderImages });
  }
}
