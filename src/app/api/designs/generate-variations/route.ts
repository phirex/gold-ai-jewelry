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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = requestSchema.parse(body);

    const fluxClient = getFluxClient();

    if (!fluxClient.isConfigured()) {
      // Return placeholder images for development
      const placeholderImages = Array(validated.count)
        .fill(null)
        .map((_, i) => `/api/placeholder/jewelry?type=${validated.jewelryType}&variant=${i}`);

      return NextResponse.json({ images: placeholderImages });
    }

    const jewelryContext: JewelryImageContext = {
      jewelryType: validated.jewelryType,
      targetGender: validated.gender,
      style: "modern", // Default style for variations
      material: validated.material,
    };

    // Generate multiple images in parallel
    const imagePromises = Array(validated.count)
      .fill(null)
      .map(async (_, index) => {
        // Add slight variation to each prompt for diversity
        const variationPrompts = [
          validated.prompt,
          `${validated.prompt}, with elegant details`,
          `${validated.prompt}, refined and sophisticated`,
          `${validated.prompt}, with unique artistic touches`,
        ];

        const variantPrompt = variationPrompts[index % variationPrompts.length];

        try {
          const imageUrl = await fluxClient.generateJewelryImage(
            variantPrompt,
            jewelryContext,
            {
              aspectRatio: "1:1",
              outputFormat: "png",
              outputQuality: 95,
            }
          );
          return imageUrl;
        } catch (error) {
          console.error(`Failed to generate variation ${index}:`, error);
          return null;
        }
      });

    const results = await Promise.all(imagePromises);
    const validImages = results.filter((url): url is string => url !== null);

    if (validImages.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any images" },
        { status: 500 }
      );
    }

    return NextResponse.json({ images: validImages });
  } catch (error) {
    console.error("Generate variations error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate variations" },
      { status: 500 }
    );
  }
}
