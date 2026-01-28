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
   * IMPORTANT: Focuses on accuracy, no unwanted elements, and clean output
   */
  buildJewelryPrompt(userPrompt: string, context?: JewelryImageContext): string {
    const parts: string[] = [];

    // 1. CRITICAL: Prohibit unwanted elements FIRST (most important)
    parts.push("STRICT RULES: NO text, NO engravings, NO inscriptions, NO writing, NO letters, NO words, NO symbols engraved on the jewelry");
    parts.push("NO people, NO hands, NO fingers, NO models, NO mannequins, NO skin, NO body parts");
    parts.push("NO duplicate items, NO extra pieces, NO background objects, NO secondary jewelry");

    // 2. Product photography framing
    parts.push("Professional luxury jewelry product photography");
    parts.push("EXACTLY ONE single isolated jewelry piece centered on pure white seamless background");

    // 3. Jewelry type with PRECISE, RESTRICTIVE descriptions
    if (context?.jewelryType) {
      const jewelryDescriptions: Record<string, string> = {
        ring: "ONLY ONE elegant finger ring with clearly defined circular band, photographed from 3/4 elevated angle showing the band thickness and any setting details, the ring floats on reflective white surface with soft shadow beneath, clean smooth metal surface without any engravings",
        necklace: "EXACTLY ONE pendant necklace with ONLY ONE delicate chain, the SINGLE chain arranged in gentle curve with ONE pendant centerpiece at the bottom, displayed flat on white surface, NO extra chains or necklaces in background, clean unadorned pendant surface",
        bracelet: "ONLY ONE wrist bracelet arranged in natural oval loop shape, showing clasp detail and link construction, displayed on white surface with subtle reflection, smooth metal without engravings",
        earrings: "EXACTLY ONE matching pair of earrings (TWO earrings only) arranged symmetrically side by side, showing post or hook details, displayed on white surface with slight separation between them, clean surfaces without text",
      };
      parts.push(jewelryDescriptions[context.jewelryType]);
    }

    // 4. Material with detailed metal rendering
    if (context?.material) {
      const materialDescriptions: Record<string, string> = {
        gold_14k: "crafted in polished 14K yellow gold with warm honey-toned lustrous finish, realistic metal reflections showing depth and dimension, subtle gold shimmer, smooth unblemished surface",
        gold_18k: "made of gleaming 18K yellow gold with rich deep golden color and mirror-like polish, light reflections dancing across the surface, luxurious warm glow, pristine smooth finish",
        gold_24k: "pure 24K gold with deep saturated warm yellow tone, soft buttery glow, highest karat gold appearance with rich color saturation, flawless polished surface",
        silver: "sterling silver 925 with bright mirror-polished surface, cool metallic sheen, crisp light reflections, contemporary silver finish, clean unmarked surface",
        platinum: "platinum with sophisticated satin brushed finish, subtle grey-white metallic luster, premium precious metal appearance, pristine surface",
        white_gold: "white gold with rhodium plating giving bright silvery finish, mirror polish with cool undertones, smooth clean surface",
        rose_gold: "rose gold with romantic warm pink undertones, polished copper-gold blend, soft rosy metallic glow, unblemished finish",
      };
      parts.push(materialDescriptions[context.material] || "precious metal with polished smooth finish");
    }

    // 5. User's specific design description (cleaned of gender references)
    const cleanedPrompt = userPrompt
      .replace(/\bfor (a )?(woman|women|man|men|female|male)\b/gi, "")
      .replace(/\b(woman|women|man|men|female|male)('s)?\b/gi, "")
      .replace(/\bmasculine\b/gi, "bold substantial")
      .replace(/\bfeminine\b/gi, "delicate elegant")
      .trim();
    if (cleanedPrompt) {
      parts.push(cleanedPrompt);
    }

    // 6. Style influences
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

    // 7. Professional photography details
    parts.push("shot with macro lens at f/11 for maximum sharpness and depth of field");
    parts.push("professional three-point studio lighting setup with soft diffused key light");
    parts.push("subtle gradient shadow beneath jewelry for depth");
    parts.push("8K ultra high resolution, photorealistic rendering, advertising quality");
    
    // 8. Final reminder - no text/engravings
    parts.push("remember: absolutely no text or engravings on the jewelry unless specifically requested");

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
