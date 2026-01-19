import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint for 3D models to avoid CORS issues
 * Fetches the model from the external URL and serves it with proper headers
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL is from trusted sources
    const trustedDomains = [
      "tripo-data.rg1.data.tripo3d.com",
      "assets.meshy.ai",
    ];

    const urlObj = new URL(url);
    if (!trustedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return NextResponse.json(
        { success: false, error: "Untrusted model source" },
        { status: 403 }
      );
    }

    // Fetch the model
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch model: ${response.status}` },
        { status: response.status }
      );
    }

    const modelData = await response.arrayBuffer();

    // Return with proper headers for GLB/GLTF
    return new NextResponse(modelData, {
      status: 200,
      headers: {
        "Content-Type": "model/gltf-binary",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Model proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to proxy model";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
