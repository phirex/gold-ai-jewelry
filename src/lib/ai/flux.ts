/**
 * Flux Pro Image Generation Client (via Replicate)
 *
 * Generates photorealistic jewelry product images using Flux Pro model.
 * These images are then used for image-to-3D conversion via Tripo3D.
 *
 * API Documentation: https://replicate.com/black-forest-labs/flux-pro
 */

const REPLICATE_API_URL = "https://api.replicate.com/v1";

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[];
  error?: string;
  urls: {
    get: string;
    cancel: string;
  };
}

export interface JewelryImageContext {
  jewelryType: "ring" | "necklace" | "bracelet" | "earrings";
  targetGender: "man" | "woman" | "unisex";
  style: "classic" | "modern" | "vintage" | "minimalist" | "bold";
  material: string;
}

export interface FluxGenerationOptions {
  width?: number;
  height?: number;
  aspectRatio?: string;
  outputFormat?: "webp" | "jpg" | "png";
  outputQuality?: number;
  safetyTolerance?: number;
  promptUpsampling?: boolean;
}

export class FluxClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REPLICATE_API_KEY || "";

    if (!this.apiKey) {
      console.warn("REPLICATE_API_KEY not set - Flux API calls will fail");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${REPLICATE_API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Replicate API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Build a professional jewelry product photography prompt
   * IMPORTANT: Focuses exclusively on the jewelry item itself, no people
   */
  buildJewelryPrompt(userPrompt: string, context?: JewelryImageContext): string {
    const parts: string[] = [];

    // 1. CRITICAL: Start with explicit product-only instruction
    parts.push("PRODUCT PHOTOGRAPHY ONLY");
    parts.push("single isolated jewelry piece on pure white background");
    parts.push("NO people, NO hands, NO fingers, NO models, NO mannequins");

    // 2. Photography style and quality markers
    parts.push("professional luxury jewelry advertisement photo");
    parts.push("studio lighting with soft shadows");
    parts.push("high-end commercial product shot");

    // 3. Jewelry type with specific shape details
    if (context?.jewelryType) {
      const jewelryDescriptions: Record<string, string> = {
        ring: "a single elegant finger ring photographed from 3/4 angle showing band and setting, displayed on white surface",
        necklace: "a pendant necklace laid flat showing full chain and pendant on white surface",
        bracelet: "a wrist bracelet arranged in oval shape on white background, product only",
        earrings: "a pair of matching earrings arranged symmetrically on white surface",
      };
      parts.push(jewelryDescriptions[context.jewelryType]);
    }

    // 4. Material with realistic properties
    if (context?.material) {
      const materialDescriptions: Record<string, string> = {
        gold_14k: "made of polished 14K yellow gold with warm lustrous finish",
        gold_18k: "crafted in gleaming 18K yellow gold with rich golden color",
        gold_24k: "pure 24K gold with deep warm yellow tone",
        silver: "sterling silver 925 with bright polished surface",
        platinum: "platinum with sophisticated brushed finish",
        white_gold: "white gold with rhodium plating",
        rose_gold: "rose gold with warm pink undertones",
      };
      parts.push(materialDescriptions[context.material] || "precious metal");
    }

    // 5. User's specific design description (cleaned of gender references that might confuse the model)
    // Remove words like "for woman", "for man" which might cause portrait generation
    const cleanedPrompt = userPrompt
      .replace(/\bfor (a )?(woman|women|man|men|female|male)\b/gi, "")
      .replace(/\b(woman|women|man|men|female|male)('s)?\b/gi, "")
      .trim();
    if (cleanedPrompt) {
      parts.push(cleanedPrompt);
    }

    // 6. Style influences
    if (context?.style) {
      const styleDescriptions: Record<string, string> = {
        classic: "timeless elegant design",
        modern: "contemporary sleek geometric design",
        vintage: "antique-inspired intricate details",
        minimalist: "simple understated pure forms",
        bold: "dramatic statement piece",
      };
      parts.push(styleDescriptions[context.style]);
    }

    // 7. Technical photography details
    parts.push("macro lens, f/8, sharp focus");
    parts.push("8K ultra high resolution photorealistic");

    return parts.join(", ");
  }

  /**
   * Create an image generation prediction
   */
  async createPrediction(
    prompt: string,
    options?: FluxGenerationOptions,
    jewelryContext?: JewelryImageContext
  ): Promise<string> {
    // Build enhanced jewelry prompt
    const enhancedPrompt = this.buildJewelryPrompt(prompt, jewelryContext);

    console.log("Flux prompt:", enhancedPrompt);

    // Use FLUX 1.1 Pro model via Replicate (upgraded from deprecated flux-pro)
    const response = await this.request<ReplicatePrediction>(
      "/models/black-forest-labs/flux-1.1-pro/predictions",
      {
        method: "POST",
        body: JSON.stringify({
          input: {
            prompt: enhancedPrompt,
            aspect_ratio: options?.aspectRatio || "1:1",
            output_format: options?.outputFormat || "png",
            output_quality: options?.outputQuality || 90,
            safety_tolerance: options?.safetyTolerance ?? 2,
            prompt_upsampling: false, // Disabled to keep prompts focused on jewelry
          },
        }),
      }
    );

    return response.id;
  }

  /**
   * Get the status of a prediction
   */
  async getPredictionStatus(predictionId: string): Promise<ReplicatePrediction> {
    return this.request<ReplicatePrediction>(`/predictions/${predictionId}`);
  }

  /**
   * Wait for prediction to complete and return image URL
   */
  async waitForCompletion(
    predictionId: string,
    options?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (status: string) => void;
    }
  ): Promise<string> {
    const maxWait = options?.maxWaitMs || 120000; // 2 minutes default
    const pollInterval = options?.pollIntervalMs || 2000; // 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const prediction = await this.getPredictionStatus(predictionId);

      if (options?.onProgress) {
        options.onProgress(prediction.status);
      }

      if (prediction.status === "succeeded") {
        // Output can be string or array of strings
        const output = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output;

        if (!output) {
          throw new Error("Prediction succeeded but no output URL found");
        }

        return output;
      }

      if (prediction.status === "failed") {
        throw new Error(`Image generation failed: ${prediction.error || "Unknown error"}`);
      }

      if (prediction.status === "canceled") {
        throw new Error("Image generation was canceled");
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Image generation timed out");
  }

  /**
   * Generate a jewelry image and wait for completion
   * Returns the URL of the generated image
   */
  async generateJewelryImage(
    prompt: string,
    jewelryContext?: JewelryImageContext,
    options?: FluxGenerationOptions
  ): Promise<string> {
    const predictionId = await this.createPrediction(prompt, options, jewelryContext);
    return this.waitForCompletion(predictionId);
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
let fluxClient: FluxClient | null = null;

export function getFluxClient(): FluxClient {
  if (!fluxClient) {
    fluxClient = new FluxClient();
  }
  return fluxClient;
}
