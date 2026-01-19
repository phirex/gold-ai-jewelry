/**
 * Meshy.ai API Client
 *
 * Meshy.ai is used for text-to-3D generation of jewelry designs.
 * API Documentation: https://docs.meshy.ai/en/api/text-to-3d
 */

const MESHY_API_URL = "https://api.meshy.ai";

// Use test mode key for development if no real key provided
const TEST_MODE_KEY = "msy_dummy_api_key_for_test_mode_12345678";

// Demo mode can be enabled via environment variable when API key has no credits
const DEMO_MODE = process.env.MESHY_DEMO_MODE === "true";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";

interface MeshyCreateTaskResponse {
  result: string; // task ID
}

interface MeshyModelUrls {
  glb?: string;
  fbx?: string;
  obj?: string;
  mtl?: string;
  usdz?: string;
}

interface MeshyTextureUrls {
  base_color?: string;
  metallic?: string;
  normal?: string;
  roughness?: string;
}

interface MeshyTaskResponse {
  id: string;
  type: "text-to-3d-preview" | "text-to-3d-refine";
  status: TaskStatus;
  progress: number;
  model_urls?: MeshyModelUrls;
  texture_urls?: MeshyTextureUrls[];
  thumbnail_url?: string;
  prompt?: string;
  art_style?: string;
  created_at: number;
  started_at?: number;
  finished_at?: number;
  task_error?: {
    message: string;
  };
}

export interface MeshyGenerationOptions {
  artStyle?: "realistic" | "sculpture";
  aiModel?: "meshy-5" | "latest";
  topology?: "quad" | "triangle";
  targetPolycount?: number;
  shouldRemesh?: boolean;
  symmetryMode?: "off" | "auto" | "on";
}

export class MeshyClient {
  private apiKey: string;
  private isTestMode: boolean;
  private isDemoMode: boolean;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.MESHY_API_KEY || "";
    this.isTestMode = !key || key === TEST_MODE_KEY;
    this.isDemoMode = DEMO_MODE;
    this.apiKey = key || TEST_MODE_KEY;

    if (this.isTestMode) {
      console.warn(
        "MESHY_API_KEY not set - Using test mode (no real 3D models will be generated)"
      );
    }
    if (this.isDemoMode) {
      console.warn(
        "MESHY_DEMO_MODE enabled - Using demo mode with sample 3D models"
      );
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${MESHY_API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Meshy API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Create a preview task (first step - generates basic 3D model)
   * Cost: 20 credits (Meshy-6) or 5 credits (other models)
   */
  async createPreviewTask(
    prompt: string,
    options?: MeshyGenerationOptions
  ): Promise<string> {
    // Enhance prompt for jewelry-specific generation
    const enhancedPrompt = this.enhanceJewelryPrompt(prompt);

    const response = await this.request<MeshyCreateTaskResponse>(
      "/openapi/v2/text-to-3d",
      {
        method: "POST",
        body: JSON.stringify({
          mode: "preview",
          prompt: enhancedPrompt,
          art_style: options?.artStyle || "realistic",
          ai_model: options?.aiModel || "latest",
          topology: options?.topology || "triangle",
          target_polycount: options?.targetPolycount || 30000,
          should_remesh: options?.shouldRemesh ?? true,
          symmetry_mode: options?.symmetryMode || "auto",
        }),
      }
    );

    return response.result;
  }

  /**
   * Create a refine task (second step - adds textures and detail)
   * Cost: 10 credits
   */
  async createRefineTask(
    previewTaskId: string,
    options?: {
      enablePbr?: boolean;
      texturePrompt?: string;
    }
  ): Promise<string> {
    const response = await this.request<MeshyCreateTaskResponse>(
      "/openapi/v2/text-to-3d",
      {
        method: "POST",
        body: JSON.stringify({
          mode: "refine",
          preview_task_id: previewTaskId,
          enable_pbr: options?.enablePbr ?? true,
          texture_prompt: options?.texturePrompt,
        }),
      }
    );

    return response.result;
  }

  /**
   * Get the status of a task
   */
  async getTaskStatus(taskId: string): Promise<MeshyTaskResponse> {
    return this.request<MeshyTaskResponse>(
      `/openapi/v2/text-to-3d/${taskId}`
    );
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
  ): Promise<MeshyTaskResponse> {
    const maxWait = options?.maxWaitMs || 180000; // 3 minutes default (Meshy is slower)
    const pollInterval = options?.pollIntervalMs || 3000; // 3 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const task = await this.getTaskStatus(taskId);

      if (options?.onProgress) {
        options.onProgress(task.progress, task.status);
      }

      if (task.status === "SUCCEEDED") {
        return task;
      }

      if (task.status === "FAILED" || task.status === "CANCELED") {
        throw new Error(
          `Task ${task.status.toLowerCase()}: ${
            task.task_error?.message || "Unknown error"
          }`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Task timed out");
  }

  /**
   * Generate a complete 3D model (preview + refine)
   * Returns the GLB URL for use in model-viewer
   */
  async generateComplete(
    prompt: string,
    options?: MeshyGenerationOptions & {
      onProgress?: (stage: string, progress: number) => void;
    }
  ): Promise<{
    modelUrl: string;
    thumbnailUrl: string;
    taskId: string;
  }> {
    // Step 1: Create preview task
    if (options?.onProgress) {
      options.onProgress("Creating preview...", 0);
    }

    const previewTaskId = await this.createPreviewTask(prompt, options);

    // Step 2: Wait for preview to complete
    const previewResult = await this.waitForCompletion(previewTaskId, {
      onProgress: (progress) => {
        if (options?.onProgress) {
          options.onProgress("Generating 3D model...", progress * 0.5);
        }
      },
    });

    // For jewelry, we want the refined model with textures
    // Step 3: Create refine task
    if (options?.onProgress) {
      options.onProgress("Refining model...", 50);
    }

    const refineTaskId = await this.createRefineTask(previewTaskId, {
      enablePbr: true,
      texturePrompt: "polished metallic jewelry finish with realistic reflections",
    });

    // Step 4: Wait for refine to complete
    const refineResult = await this.waitForCompletion(refineTaskId, {
      onProgress: (progress) => {
        if (options?.onProgress) {
          options.onProgress("Adding textures...", 50 + progress * 0.5);
        }
      },
    });

    return {
      modelUrl: refineResult.model_urls?.glb || previewResult.model_urls?.glb || "",
      thumbnailUrl: refineResult.thumbnail_url || previewResult.thumbnail_url || "",
      taskId: refineTaskId,
    };
  }

  /**
   * Enhance a prompt for better jewelry generation results
   */
  private enhanceJewelryPrompt(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();

    // Build enhancement string
    const enhancements: string[] = [];

    // Add jewelry context if not present
    if (!lowerPrompt.includes("jewelry") && !lowerPrompt.includes("jewellery")) {
      enhancements.push("jewelry piece");
    }

    // Add quality modifiers
    enhancements.push(
      "high quality",
      "detailed craftsmanship",
      "professional product render",
      "clean background"
    );

    // Combine with original prompt
    return `${prompt}, ${enhancements.join(", ")}`;
  }

  /**
   * Check if running in test mode
   */
  isInTestMode(): boolean {
    return this.isTestMode;
  }

  /**
   * Check if running in demo mode (API key exists but no credits)
   */
  isInDemoMode(): boolean {
    return this.isDemoMode;
  }
}

// Singleton instance
let meshyClient: MeshyClient | null = null;

export function getMeshyClient(): MeshyClient {
  if (!meshyClient) {
    meshyClient = new MeshyClient();
  }
  return meshyClient;
}
