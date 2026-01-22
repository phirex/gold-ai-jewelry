import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getTripoClient } from "@/lib/ai/tripo3d";

const requestSchema = z.object({
  imageUrl: z.string().url(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = requestSchema.parse(body);

    const tripoClient = getTripoClient();

    if (!tripoClient.isConfigured()) {
      // Return a mock task ID for development
      return NextResponse.json({
        taskId: `mock-task-${Date.now()}`,
        message: "Development mode - no Tripo API key configured",
      });
    }

    // Step 1: Upload image to Tripo3D and get token
    console.log("Uploading image to Tripo3D:", validated.imageUrl);
    const imageToken = await tripoClient.uploadImageFromUrl(validated.imageUrl);
    console.log("Got image token:", imageToken);

    // Step 2: Create image-to-3D task
    const taskId = await tripoClient.createImageTo3DTask(imageToken, {
      modelVersion: "v2.0-20240919",
      faceLimit: 20000, // Higher quality for jewelry
    });

    console.log("Created 3D conversion task:", taskId);

    return NextResponse.json({
      taskId,
      message: "3D conversion started",
    });
  } catch (error) {
    console.error("Convert to 3D error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Failed to start 3D conversion";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
