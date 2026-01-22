import { NextRequest, NextResponse } from "next/server";
import { getTripoClient } from "@/lib/ai/tripo3d";
import { getNanoBananaClient, type JewelryImageContext } from "@/lib/ai/nano-banana";
import { getFluxClient } from "@/lib/ai/flux";
import { setPreviewImage } from "../status/route";
import { z } from "zod";

const generateSchema = z.object({
  prompt: z.string().min(10).max(1000),
  jewelryType: z.enum(["ring", "necklace", "bracelet", "earrings"]),
  targetGender: z.enum(["man", "woman", "unisex"]),
  style: z.enum(["classic", "modern", "vintage", "minimalist", "bold"]),
  material: z.enum(["gold_14k", "gold_18k", "gold_24k", "silver", "platinum"]),
  // Option to use old text-to-3D (for testing/comparison)
  useTextTo3D: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = generateSchema.parse(body);

    const tripoClient = getTripoClient();
    const nanoBananaClient = getNanoBananaClient();
    const fluxClient = getFluxClient(); // Keep as fallback

    // Check if API keys are configured
    if (!tripoClient.isConfigured()) {
      return NextResponse.json(
        { success: false, error: "Tripo3D API key not configured" },
        { status: 500 }
      );
    }

    // Build jewelry context for prompt generation
    const jewelryContext: JewelryImageContext = {
      jewelryType: validatedData.jewelryType,
      targetGender: validatedData.targetGender,
      style: validatedData.style,
      material: validatedData.material,
    };

    // Check if we should use the new image-to-3D pipeline
    const useImageTo3D = !validatedData.useTextTo3D && nanoBananaClient.isConfigured();

    if (useImageTo3D) {
      // === IMAGE-TO-3D PIPELINE WITH NANO BANANA ===
      // Step 1: Generate photorealistic jewelry image with Nano Banana Flash (fast & cheap)
      console.log("Starting image-to-3D pipeline...");
      console.log("Step 1: Generating jewelry image with Nano Banana Flash...");

      const imageUrl = await nanoBananaClient.generateDraft(
        validatedData.prompt,
        jewelryContext,
        {
          aspectRatio: "1:1",
          outputFormat: "png",
        }
      );

      console.log("Image generated:", imageUrl);

      // Step 2: Upload image to Tripo and get token
      console.log("Step 2: Uploading image to Tripo3D...");
      const imageToken = await tripoClient.uploadImageFromUrl(imageUrl);
      console.log("Image token:", imageToken);

      // Step 3: Start image-to-3D conversion
      console.log("Step 3: Starting image-to-3D conversion...");
      const taskId = await tripoClient.createImageTo3DTask(imageToken, {
        modelVersion: "v2.0-20240919",
        faceLimit: 20000,
      });

      // Save preview image for status endpoint
      setPreviewImage(taskId, imageUrl);

      return NextResponse.json({
        success: true,
        taskId,
        message: "Generation started (Nano Banana + Tripo3D pipeline)",
        pipeline: "image-to-3d",
        previewImageUrl: imageUrl, // Return the 2D preview image
      });
    } else {
      // === FALLBACK: OLD TEXT-TO-3D PIPELINE ===
      console.log("Using fallback text-to-3D pipeline...");

      if (!nanoBananaClient.isConfigured()) {
        console.warn("REPLICATE_API_KEY not configured - using text-to-3D fallback");
      }

      // Import the old jewelry context type for text-to-3D
      const textJewelryContext = {
        jewelryType: validatedData.jewelryType,
        targetGender: validatedData.targetGender,
        style: validatedData.style,
        material: validatedData.material,
      };

      const taskId = await tripoClient.createTask(
        validatedData.prompt,
        {
          modelVersion: "v2.0-20240919",
          faceLimit: 15000,
          texture: true,
          pbr: true,
        },
        textJewelryContext
      );

      return NextResponse.json({
        success: true,
        taskId,
        message: "Generation started (text-to-3D fallback)",
        pipeline: "text-to-3d",
      });
    }
  } catch (error) {
    console.error("Generation error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to start generation";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
