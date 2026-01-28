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
        // Parse retry_after from response if available
        let retryAfter = 5000; // default 5 seconds
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.retry_after) {
            retryAfter = (errorJson.retry_after + 1) * 1000; // Add 1 second buffer
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

    // 4. Material with DETAILED realistic metal rendering
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

    // 6. Style influences with more detail
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

    // 7. Professional photography technique details
    parts.push("shot with macro lens at f/11 for maximum sharpness and depth of field");
    parts.push("professional three-point studio lighting setup with soft diffused key light");
    parts.push("subtle gradient shadow beneath jewelry for depth");
    parts.push("8K ultra high resolution, photorealistic rendering, advertising quality");
    
    // 8. Final reminder - no text/engravings
    parts.push("remember: absolutely no text or engravings on the jewelry unless specifically requested");

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
    const status = await this.request<ReplicatePrediction>(`/predictions/${predictionId}`);
    console.log(`Prediction ${predictionId} status:`, status.status);
    return status;
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
    options?: FluxGenerationOptions,
    waitOptions?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (status: string) => void;
    }
  ): Promise<string> {
    const predictionId = await this.createPrediction(prompt, options, jewelryContext);
    return this.waitForCompletion(predictionId, {
      maxWaitMs: waitOptions?.maxWaitMs || 25000, // 25 seconds default for jewelry generation
      pollIntervalMs: waitOptions?.pollIntervalMs || 2000,
      onProgress: waitOptions?.onProgress,
    });
  }

  /**
   * Create an image-to-image prediction using SDXL
   * This allows refining an existing image based on a new prompt
   * SDXL is fast, reliable, and has proper img2img support
   */
  async createImg2ImgPrediction(
    imageUrl: string,
    prompt: string,
    options?: {
      strength?: number; // 0-1, how much to change (0.3 for subtle, 0.65-0.8 for significant changes)
      steps?: number;
    }
  ): Promise<string> {
    console.log("SDXL img2img prompt:", prompt);
    console.log("Source image:", imageUrl);
    console.log("Prompt strength:", options?.strength ?? 0.65);

    // Use SDXL for reliable img2img with prompt guidance
    const response = await this.request<ReplicatePrediction>(
      "/predictions",
      {
        method: "POST",
        body: JSON.stringify({
          version: "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
          input: {
            image: imageUrl,
            prompt: prompt,
            prompt_strength: options?.strength ?? 0.65, // Higher strength for visible changes
            num_inference_steps: options?.steps ?? 50, // More steps for better quality
            guidance_scale: 8.0, // Slightly higher guidance for prompt adherence
            scheduler: "K_EULER",
            num_outputs: 1,
            disable_safety_checker: true, // Disable false positives on jewelry images
          },
        }),
      }
    );

    console.log("Created SDXL img2img prediction:", response.id, "status:", response.status);
    return response.id;
  }

  /**
   * Refine an existing jewelry image based on a new prompt
   * Uses SDXL img2img to maintain the base design while applying modifications
   */
  async refineJewelryImage(
    sourceImageUrl: string,
    refinementPrompt: string,
    options?: {
      strength?: number; // 0.3-0.5 for subtle changes, 0.6-0.8 for significant changes
      maxWaitMs?: number;
    }
  ): Promise<string> {
    console.log("Refining jewelry image with SDXL img2img");
    console.log("Source:", sourceImageUrl);
    console.log("Prompt:", refinementPrompt);
    console.log("Strength:", options?.strength ?? 0.65);

    // The prompt from Claude should already be complete and detailed
    // Only add quality markers if they're not already present
    let finalPrompt = refinementPrompt;
    if (!refinementPrompt.toLowerCase().includes("product photography")) {
      finalPrompt = `${refinementPrompt}, professional jewelry product photography, pure white background, studio lighting, photorealistic, 8K quality`;
    }

    console.log("Final SDXL prompt:", finalPrompt);

    const predictionId = await this.createImg2ImgPrediction(
      sourceImageUrl,
      finalPrompt,
      {
        strength: options?.strength ?? 0.65, // Higher strength for visible changes
        steps: 50, // More steps for better quality
      }
    );

    return this.waitForCompletion(predictionId, {
      maxWaitMs: options?.maxWaitMs || 60000,
      pollIntervalMs: 2000,
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
let fluxClient: FluxClient | null = null;

export function getFluxClient(): FluxClient {
  if (!fluxClient) {
    fluxClient = new FluxClient();
  }
  return fluxClient;
}
