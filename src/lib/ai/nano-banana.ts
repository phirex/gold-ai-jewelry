/**
 * Nano Banana Image Generation Client (via Replicate)
 *
 * Hybrid approach using:
 * - Nano Banana: Google's Gemini 2.5 image model - fast generations
 * - Nano Banana Pro: Google's state-of-the-art image generation model
 *
 * API Documentation:
 * - https://replicate.com/google/nano-banana
 * - https://replicate.com/google/nano-banana-pro
 */

const REPLICATE_API_URL = "https://api.replicate.com/v1";

// Model identifiers on Replicate
const MODEL_FLASH = "google/nano-banana";
const MODEL_PRO = "google/nano-banana-pro";

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

export interface NanoBananaOptions {
  aspectRatio?: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3";
  outputFormat?: "jpg" | "png";
}

export class NanoBananaClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.REPLICATE_API_KEY || "";

    if (!this.apiKey) {
      console.warn("REPLICATE_API_KEY not set - Nano Banana API calls will fail");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const MAX_RETRIES = 3;

    const response = await fetch(`${REPLICATE_API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Handle rate limiting with retry
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        let retryAfter = 5000;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.retry_after) {
            retryAfter = (errorJson.retry_after + 1) * 1000;
          }
        } catch {
          // Use default retry time
        }

        console.log(`Rate limited. Retrying in ${retryAfter}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise((resolve) => setTimeout(resolve, retryAfter));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw new Error(`Replicate API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Build a professional jewelry product photography prompt
   */
  buildJewelryPrompt(userPrompt: string, context?: JewelryImageContext): string {
    const parts: string[] = [];

    // 1. Product photography framing
    parts.push("Professional luxury jewelry product photography");
    parts.push("single isolated jewelry piece centered on pure white seamless background");
    parts.push("NO people, NO hands, NO fingers, NO models, NO mannequins, NO skin");

    // 2. Jewelry type with detailed descriptions
    if (context?.jewelryType) {
      const jewelryDescriptions: Record<string, string> = {
        ring: "a single elegant finger ring with clearly defined circular band, photographed from 3/4 elevated angle showing the band thickness and any setting details, the ring appears to float on reflective white surface with soft shadow beneath",
        necklace: "a beautiful pendant necklace with delicate chain links visible, laid in gentle S-curve shape showing the full chain length and pendant centerpiece, displayed flat on white surface",
        bracelet: "a wrist bracelet arranged in natural oval loop shape as if worn, showing clasp detail and link construction, displayed on white surface with subtle reflection",
        earrings: "a matching pair of earrings arranged symmetrically side by side, showing post or hook details, displayed on white surface with slight separation between them",
      };
      parts.push(jewelryDescriptions[context.jewelryType]);
    }

    // 3. Material with detailed metal rendering
    if (context?.material) {
      const materialDescriptions: Record<string, string> = {
        gold_14k: "crafted in polished 14K yellow gold with warm honey-toned lustrous finish, realistic metal reflections showing depth and dimension, subtle gold shimmer",
        gold_18k: "made of gleaming 18K yellow gold with rich deep golden color and mirror-like polish, light reflections dancing across the surface, luxurious warm glow",
        gold_24k: "pure 24K gold with deep saturated warm yellow tone, soft buttery glow, highest karat gold appearance with rich color saturation",
        silver: "sterling silver 925 with bright mirror-polished surface, cool metallic sheen, crisp light reflections, contemporary silver finish",
        platinum: "platinum with sophisticated satin brushed finish, subtle grey-white metallic luster, premium precious metal appearance",
        white_gold: "white gold with rhodium plating giving bright silvery finish, mirror polish with cool undertones",
        rose_gold: "rose gold with romantic warm pink undertones, polished copper-gold blend, soft rosy metallic glow",
      };
      parts.push(materialDescriptions[context.material] || "precious metal with polished finish");
    }

    // 4. User's specific design description (cleaned of gender references)
    const cleanedPrompt = userPrompt
      .replace(/\bfor (a )?(woman|women|man|men|female|male)\b/gi, "")
      .replace(/\b(woman|women|man|men|female|male)('s)?\b/gi, "")
      .replace(/\bmasculine\b/gi, "bold substantial")
      .replace(/\bfeminine\b/gi, "delicate elegant")
      .trim();
    if (cleanedPrompt) {
      parts.push(cleanedPrompt);
    }

    // 5. Style influences
    if (context?.style) {
      const styleDescriptions: Record<string, string> = {
        classic: "timeless elegant design with refined proportions and traditional craftsmanship",
        modern: "contemporary sleek geometric design with clean lines and minimalist aesthetic",
        vintage: "antique-inspired design with intricate filigree details and ornate craftsmanship",
        minimalist: "simple understated pure forms with clean silhouette and subtle elegance",
        bold: "dramatic statement piece with substantial presence and eye-catching design",
      };
      parts.push(styleDescriptions[context.style]);
    }

    // 6. Professional photography details
    parts.push("shot with macro lens at f/11 for maximum sharpness and depth of field");
    parts.push("professional three-point studio lighting setup with soft diffused key light");
    parts.push("subtle gradient shadow beneath jewelry for depth");
    parts.push("8K ultra high resolution, photorealistic rendering, advertising quality");

    return parts.join(", ");
  }

  /**
   * Create a prediction with the specified model
   */
  private async createPrediction(
    model: string,
    prompt: string,
    options?: NanoBananaOptions,
    referenceImages?: string[]
  ): Promise<string> {
    console.log(`Creating ${model} prediction...`);
    console.log("Prompt:", prompt.substring(0, 200) + "...");

    // Nano Banana only accepts: prompt, aspect_ratio, output_format, image_input
    const input: Record<string, unknown> = {
      prompt: prompt,
      aspect_ratio: options?.aspectRatio || "1:1",
      output_format: options?.outputFormat || "png",
    };

    // Add reference images for refinement
    if (referenceImages && referenceImages.length > 0) {
      input.image_input = referenceImages;
    }

    const response = await this.request<ReplicatePrediction>(
      `/models/${model}/predictions`,
      {
        method: "POST",
        body: JSON.stringify({ input }),
      }
    );

    console.log(`Created prediction ${response.id}, status: ${response.status}`);
    return response.id;
  }

  /**
   * Get prediction status
   */
  async getPredictionStatus(predictionId: string): Promise<ReplicatePrediction> {
    const status = await this.request<ReplicatePrediction>(`/predictions/${predictionId}`);
    return status;
  }

  /**
   * Wait for prediction to complete
   */
  async waitForCompletion(
    predictionId: string,
    options?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (status: string) => void;
    }
  ): Promise<string> {
    const maxWait = options?.maxWaitMs || 180000; // 3 minutes default (Pro is slow)
    const pollInterval = options?.pollIntervalMs || 3000; // 3 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const prediction = await this.getPredictionStatus(predictionId);

      if (options?.onProgress) {
        options.onProgress(prediction.status);
      }

      if (prediction.status === "succeeded") {
        const output = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output;

        if (!output) {
          throw new Error("Prediction succeeded but no output URL found");
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`Prediction completed in ${elapsed}s`);
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
   * Generate a draft jewelry image using Nano Banana Flash (fast & cheap)
   * Use for initial generation and variations
   */
  async generateDraft(
    prompt: string,
    jewelryContext?: JewelryImageContext,
    options?: NanoBananaOptions,
    waitOptions?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (status: string) => void;
    }
  ): Promise<string> {
    const enhancedPrompt = this.buildJewelryPrompt(prompt, jewelryContext);

    const predictionId = await this.createPrediction(
      MODEL_FLASH,
      enhancedPrompt,
      options
    );

    return this.waitForCompletion(predictionId, {
      maxWaitMs: waitOptions?.maxWaitMs || 30000, // 30s for Flash
      pollIntervalMs: waitOptions?.pollIntervalMs || 2000,
      onProgress: waitOptions?.onProgress,
    });
  }

  /**
   * Generate a high-quality final image using Nano Banana Pro
   * Use only before 3D conversion for best results
   */
  async generateFinal(
    prompt: string,
    jewelryContext?: JewelryImageContext,
    options?: NanoBananaOptions,
    waitOptions?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (status: string) => void;
    }
  ): Promise<string> {
    const enhancedPrompt = this.buildJewelryPrompt(prompt, jewelryContext);

    const predictionId = await this.createPrediction(
      MODEL_PRO,
      enhancedPrompt,
      options
    );

    return this.waitForCompletion(predictionId, {
      maxWaitMs: waitOptions?.maxWaitMs || 180000, // 3 minutes for Pro
      pollIntervalMs: waitOptions?.pollIntervalMs || 3000,
      onProgress: waitOptions?.onProgress,
    });
  }

  /**
   * Refine an existing image using a reference image + new prompt
   * Uses Nano Banana Flash for fast iterations
   * The model will use the reference image to guide the new generation
   */
  async refineImage(
    sourceImageUrl: string,
    refinementPrompt: string,
    options?: NanoBananaOptions & {
      maxWaitMs?: number;
      usePro?: boolean; // Use Pro model for higher quality refinement
    }
  ): Promise<string> {
    console.log("Refining image with Nano Banana");
    console.log("Source:", sourceImageUrl);
    console.log("Refinement prompt:", refinementPrompt);

    // Build the refinement prompt
    let finalPrompt = refinementPrompt;
    if (!refinementPrompt.toLowerCase().includes("product photography")) {
      finalPrompt = `${refinementPrompt}, professional jewelry product photography, pure white background, studio lighting, photorealistic, 8K quality`;
    }

    const model = options?.usePro ? MODEL_PRO : MODEL_FLASH;
    const maxWait = options?.usePro ? 180000 : 60000;

    const predictionId = await this.createPrediction(
      model,
      finalPrompt,
      options,
      [sourceImageUrl] // Pass source image as reference
    );

    return this.waitForCompletion(predictionId, {
      maxWaitMs: options?.maxWaitMs || maxWait,
      pollIntervalMs: 3000,
    });
  }

  /**
   * Upgrade an existing image to Pro quality
   * Useful for finalizing before 3D conversion
   */
  async upgradeToProQuality(
    sourceImageUrl: string,
    originalPrompt: string,
    jewelryContext?: JewelryImageContext,
    options?: {
      maxWaitMs?: number;
      onProgress?: (status: string) => void;
    }
  ): Promise<string> {
    console.log("Upgrading image to Pro quality...");

    const enhancedPrompt = this.buildJewelryPrompt(originalPrompt, jewelryContext);

    const predictionId = await this.createPrediction(
      MODEL_PRO,
      enhancedPrompt,
      { aspectRatio: "1:1" },
      [sourceImageUrl] // Use original as reference for consistency
    );

    return this.waitForCompletion(predictionId, {
      maxWaitMs: options?.maxWaitMs || 180000,
      pollIntervalMs: 3000,
      onProgress: options?.onProgress,
    });
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
let nanoBananaClient: NanoBananaClient | null = null;

export function getNanoBananaClient(): NanoBananaClient {
  if (!nanoBananaClient) {
    nanoBananaClient = new NanoBananaClient();
  }
  return nanoBananaClient;
}
