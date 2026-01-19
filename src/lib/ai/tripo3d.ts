/**
 * Tripo3D API Client
 *
 * Tripo3D is used for text-to-3D and image-to-3D generation of jewelry designs.
 * API Documentation: https://platform.tripo3d.ai/docs
 */

const TRIPO_API_URL = "https://api.tripo3d.ai/v2/openapi";

type TaskStatus = "queued" | "running" | "success" | "failed" | "cancelled" | "unknown";

interface TripoCreateTaskResponse {
  code: number;
  data: {
    task_id: string;
  };
}

interface TripoUploadResponse {
  code: number;
  data: {
    image_token: string;
  };
}

interface TripoTaskResponse {
  code: number;
  data: {
    task_id: string;
    type: string;
    status: TaskStatus;
    input: Record<string, unknown>;
    output?: {
      model?: string; // URL to the GLB model (non-PBR)
      pbr_model?: string; // URL to the PBR GLB model
      rendered_image?: string;
    };
    progress: number;
    create_time: number;
  };
}

export interface TripoGenerationOptions {
  modelVersion?: "v2.0-20240919" | "v1.4-20240625";
  faceLimit?: number;
  texture?: boolean;
  pbr?: boolean;
  negativePrompt?: string;
  seed?: number;
  autoSize?: boolean;
}

export interface JewelryContext {
  jewelryType: "ring" | "necklace" | "bracelet" | "earrings";
  targetGender: "man" | "woman" | "unisex";
  style: "classic" | "modern" | "vintage" | "minimalist" | "bold";
  material: string;
}

export class TripoClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TRIPO_API_KEY || "";

    if (!this.apiKey) {
      console.warn("TRIPO_API_KEY not set - Tripo3D API calls will fail");
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${TRIPO_API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Tripo API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    if (data.code !== 0) {
      throw new Error(`Tripo API error: ${data.message || "Unknown error"}`);
    }

    return data;
  }

  /**
   * Create a text-to-3D task for jewelry
   */
  async createTask(
    prompt: string,
    options?: TripoGenerationOptions,
    jewelryContext?: JewelryContext
  ): Promise<string> {
    // Build professional jewelry prompt (max 1024 chars)
    let enhancedPrompt = this.buildJewelryPrompt(prompt, jewelryContext);
    if (enhancedPrompt.length > 1024) {
      enhancedPrompt = enhancedPrompt.substring(0, 1024);
    }

    // Build negative prompt to avoid common issues (max 255 chars)
    let negativePrompt = options?.negativePrompt || this.buildNegativePrompt(jewelryContext);
    if (negativePrompt.length > 255) {
      negativePrompt = negativePrompt.substring(0, 255);
    }

    console.log("Tripo prompt:", enhancedPrompt);
    console.log("Tripo negative_prompt:", negativePrompt);

    const response = await this.request<TripoCreateTaskResponse>("/task", {
      method: "POST",
      body: JSON.stringify({
        type: "text_to_model",
        prompt: enhancedPrompt,
        negative_prompt: negativePrompt,
        model_version: options?.modelVersion || "v2.0-20240919",
        face_limit: options?.faceLimit || 15000,
        texture: options?.texture ?? true,
        pbr: options?.pbr ?? true,
      }),
    });

    return response.data.task_id;
  }

  /**
   * Get the status of a task
   */
  async getTaskStatus(taskId: string): Promise<TripoTaskResponse["data"]> {
    const response = await this.request<TripoTaskResponse>(`/task/${taskId}`);
    return response.data;
  }

  /**
   * Upload an image from URL and get an image token for image-to-3D
   */
  async uploadImageFromUrl(imageUrl: string): Promise<string> {
    // First, fetch the image data
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");

    // Determine content type
    const contentType = imageResponse.headers.get("content-type") || "image/png";
    const extension = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png";

    // Upload to Tripo using their upload endpoint
    const formData = new FormData();
    const imageFile = new Blob([imageBuffer], { type: contentType });
    formData.append("file", imageFile, `jewelry_image.${extension}`);

    const uploadResponse = await fetch(`${TRIPO_API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Tripo upload error: ${uploadResponse.status} - ${error}`);
    }

    const uploadData = await uploadResponse.json() as TripoUploadResponse;

    if (uploadData.code !== 0) {
      throw new Error(`Tripo upload error: code ${uploadData.code}`);
    }

    return uploadData.data.image_token;
  }

  /**
   * Create an image-to-3D task for better quality jewelry models
   * This produces much better results than text-to-3D for realistic jewelry
   */
  async createImageTo3DTask(
    imageToken: string,
    options?: {
      modelVersion?: "v2.0-20240919" | "v1.4-20240625";
      faceLimit?: number;
    }
  ): Promise<string> {
    console.log("Creating image-to-3D task with token:", imageToken);

    const response = await this.request<TripoCreateTaskResponse>("/task", {
      method: "POST",
      body: JSON.stringify({
        type: "image_to_model",
        file: {
          type: "jpg", // or png based on original
          file_token: imageToken,
        },
        model_version: options?.modelVersion || "v2.0-20240919",
        face_limit: options?.faceLimit || 20000,
      }),
    });

    return response.data.task_id;
  }

  /**
   * Wait for a task to complete (with polling)
   */
  async waitForCompletion(
    taskId: string,
    options?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (progress: number, status: TaskStatus) => void;
    }
  ): Promise<TripoTaskResponse["data"]> {
    const maxWait = options?.maxWaitMs || 120000; // 2 minutes default
    const pollInterval = options?.pollIntervalMs || 2000; // 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const task = await this.getTaskStatus(taskId);

      if (options?.onProgress) {
        options.onProgress(task.progress, task.status);
      }

      if (task.status === "success") {
        return task;
      }

      if (task.status === "failed" || task.status === "cancelled") {
        throw new Error(`Task ${task.status}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Task timed out");
  }

  /**
   * Build a professional jewelry prompt following best practices
   * Focus on PHOTOREALISTIC jewelry product photography style
   */
  private buildJewelryPrompt(prompt: string, context?: JewelryContext): string {
    const parts: string[] = [];

    // 1. Start with photorealistic quality marker
    parts.push("photorealistic product photography of");

    // 2. Main Subject - Clear jewelry type definition with specific shapes
    if (context?.jewelryType) {
      const jewelryTypes: Record<string, string> = {
        ring: "a real gold finger ring with circular band shape",
        necklace: "a real gold pendant necklace with delicate chain",
        bracelet: "a real gold wrist bracelet with linked segments",
        earrings: "a pair of real gold earrings",
      };
      parts.push(jewelryTypes[context.jewelryType]);
    } else {
      parts.push("a piece of real fine jewelry");
    }

    // 3. User's design description
    parts.push(prompt);

    // 4. Material with VERY specific realistic properties
    if (context?.material) {
      const materialDescriptions: Record<string, string> = {
        gold_14k: "14K yellow gold with mirror-like polished surface, realistic gold color #FFD700, subtle warm reflections",
        gold_18k: "18K yellow gold with high-gloss polished finish, rich golden tone, professional jewelry grade metal",
        gold_24k: "24K pure gold with brilliant lustrous finish, deep warm yellow color, soft metallic glow",
        silver: "sterling silver 925 with bright polished surface, cool metallic reflections, professional jewelry finish",
        platinum: "platinum with satin brushed finish, white metallic luster, luxury jewelry grade",
      };
      parts.push(materialDescriptions[context.material] || "precious metal with polished surface");
    }

    // 5. Realism emphasis - critical for good results
    parts.push(
      "ultra realistic",
      "jewelry store product photo",
      "macro lens detail",
      "professional studio lighting with soft shadows",
      "clean white background",
      "8K resolution detail",
      "physically accurate metal reflections",
      "no stylization"
    );

    return parts.join(", ");
  }

  /**
   * Build negative prompt to avoid common jewelry generation issues
   * Max 255 characters for Tripo API
   */
  private buildNegativePrompt(context?: JewelryContext): string {
    // Core negatives - focus on avoiding stylization and getting realistic output
    const negatives: string[] = [
      "cartoon",
      "stylized",
      "low poly",
      "game asset",
      "toy",
      "plastic",
      "matte finish",
      "dull",
      "rough texture",
      "CGI look",
      "unrealistic",
    ];

    // Add type-specific negatives
    if (context?.jewelryType === "ring") {
      negatives.push("open ring", "broken band");
    }

    return negatives.join(", ");
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Singleton instance
let tripoClient: TripoClient | null = null;

export function getTripoClient(): TripoClient {
  if (!tripoClient) {
    tripoClient = new TripoClient();
  }
  return tripoClient;
}
