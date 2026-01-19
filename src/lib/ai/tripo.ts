/**
 * Tripo3D API Client
 *
 * Tripo3D is used for text-to-3D generation of jewelry designs.
 * API Documentation: https://platform.tripo3d.ai/docs
 */

const TRIPO_API_URL = "https://api.tripo3d.ai/v2/openapi";

interface TripoGenerateRequest {
  prompt: string;
  model_version?: "v1.4-20240625" | "v2.0-20240919";
  negative_prompt?: string;
}

interface TripoTaskResponse {
  code: number;
  data: {
    task_id: string;
  };
}

interface TripoTaskStatus {
  code: number;
  data: {
    task_id: string;
    status: "queued" | "running" | "success" | "failed";
    progress: number;
    output?: {
      model?: {
        url: string;
        type: string;
      };
      rendered_image?: {
        url: string;
      };
    };
    error?: string;
  };
}

export class TripoClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TRIPO_API_KEY || "";
    if (!this.apiKey) {
      console.warn("TRIPO_API_KEY not set - Tripo3D features will not work");
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

    return response.json();
  }

  /**
   * Generate a 3D model from a text prompt
   */
  async generateFromText(
    prompt: string,
    options?: {
      modelVersion?: "v1.4-20240625" | "v2.0-20240919";
      negativePrompt?: string;
    }
  ): Promise<string> {
    // Enhance prompt for jewelry-specific generation
    const enhancedPrompt = this.enhanceJewelryPrompt(prompt);

    const response = await this.request<TripoTaskResponse>("/task", {
      method: "POST",
      body: JSON.stringify({
        type: "text_to_model",
        prompt: enhancedPrompt,
        model_version: options?.modelVersion || "v2.0-20240919",
        negative_prompt: options?.negativePrompt,
      }),
    });

    return response.data.task_id;
  }

  /**
   * Check the status of a generation task
   */
  async getTaskStatus(taskId: string): Promise<TripoTaskStatus["data"]> {
    const response = await this.request<TripoTaskStatus>(`/task/${taskId}`);
    return response.data;
  }

  /**
   * Wait for a task to complete (with polling)
   */
  async waitForCompletion(
    taskId: string,
    options?: {
      maxWaitMs?: number;
      pollIntervalMs?: number;
      onProgress?: (progress: number) => void;
    }
  ): Promise<TripoTaskStatus["data"]> {
    const maxWait = options?.maxWaitMs || 120000; // 2 minutes default
    const pollInterval = options?.pollIntervalMs || 2000; // 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const status = await this.getTaskStatus(taskId);

      if (options?.onProgress) {
        options.onProgress(status.progress);
      }

      if (status.status === "success") {
        return status;
      }

      if (status.status === "failed") {
        throw new Error(`Task failed: ${status.error || "Unknown error"}`);
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error("Task timed out");
  }

  /**
   * Enhance a prompt for better jewelry generation results
   */
  private enhanceJewelryPrompt(prompt: string): string {
    // Add jewelry-specific modifiers for better quality
    const enhancements = [
      "high quality jewelry",
      "metallic finish",
      "detailed craftsmanship",
      "professional product photography style",
    ];

    // Check if prompt already has these elements
    const lowerPrompt = prompt.toLowerCase();
    const additions: string[] = [];

    if (!lowerPrompt.includes("jewelry") && !lowerPrompt.includes("jewellery")) {
      additions.push("jewelry piece");
    }

    if (
      !lowerPrompt.includes("gold") &&
      !lowerPrompt.includes("silver") &&
      !lowerPrompt.includes("platinum")
    ) {
      // Don't force a metal if not specified
    }

    // Combine with original prompt
    return `${prompt}, ${additions.join(", ")}, ${enhancements.join(", ")}`;
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
