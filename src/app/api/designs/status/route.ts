import { NextRequest, NextResponse } from "next/server";
import { getTripoClient } from "@/lib/ai/tripo3d";

// Store preview images temporarily (in production, use Redis or database)
const previewImageCache = new Map<string, string>();

export function setPreviewImage(taskId: string, imageUrl: string) {
  previewImageCache.set(taskId, imageUrl);
  // Clean up after 1 hour
  setTimeout(() => previewImageCache.delete(taskId), 3600000);
}

export async function GET(request: NextRequest) {
  try {
    const taskId = request.nextUrl.searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    const tripoClient = getTripoClient();
    const task = await tripoClient.getTaskStatus(taskId);

    // Get the raw model URL from Tripo
    const rawModelUrl = task.output?.pbr_model || task.output?.model || null;

    // Proxy the model URL through our API to avoid CORS issues
    const modelUrl = rawModelUrl
      ? `/api/proxy/model?url=${encodeURIComponent(rawModelUrl)}`
      : null;

    // Get preview image from cache if available
    const previewImageUrl = previewImageCache.get(taskId) || null;

    return NextResponse.json({
      success: true,
      status: task.status,
      progress: task.progress,
      modelUrl,
      thumbnailUrl: task.output?.rendered_image || null,
      previewImageUrl, // The 2D image used for image-to-3D
    });
  } catch (error) {
    console.error("Status check error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to check status";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
