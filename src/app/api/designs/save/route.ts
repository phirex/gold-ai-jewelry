import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { calculatePriceAdvanced } from "@/lib/pricing/calculator";

/**
 * Save Design API - Persists user designs to database with pricing estimation
 * 
 * This is called when:
 * 1. User generates variations (saves as draft)
 * 2. User enhances image (updates design)
 * 3. User converts to 3D (updates with model URL)
 */

const stoneSchema = z.object({
  type: z.enum(["diamond", "sapphire", "ruby", "emerald"]),
  size: z.union([
    z.enum(["tiny", "small", "medium", "large", "statement"]),
    z.number().positive(),
  ]),
  quality: z.enum(["economy", "standard", "premium", "luxury"]).optional(),
  quantity: z.number().int().positive(),
});

const saveDesignSchema = z.object({
  // Required fields
  prompt: z.string().min(10),
  jewelryType: z.enum(["ring", "necklace", "bracelet", "earrings"]),
  targetGender: z.enum(["man", "woman", "unisex"]),
  
  // Optional fields
  designId: z.string().optional(), // For updates
  name: z.string().optional(),
  material: z.enum(["gold_14k", "gold_18k", "gold_24k", "silver", "platinum"]).default("gold_18k"),
  thumbnailUrl: z.string().url().optional(),
  modelUrl: z.string().optional(), // Can be a proxied URL starting with /api/
  stones: z.array(stoneSchema).optional(),
  complexity: z.enum(["simple", "moderate", "complex", "master"]).optional(),
  size: z.enum(["small", "medium", "large"]).optional(),
  chatHistory: z.array(z.any()).optional(),
  status: z.enum(["draft", "saved", "ordered"]).optional(),
  tripoTaskId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = saveDesignSchema.parse(body);
    
    // Get user session (optional - allows anonymous designs too)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;
    
    // Calculate price estimation using image analysis if available
    let estimatedPrice: number | null = null;
    let complexity = validated.complexity || "moderate";
    
    try {
      const priceBreakdown = await calculatePriceAdvanced({
        material: validated.material,
        jewelryType: validated.jewelryType,
        description: validated.prompt,
        size: validated.size || "medium",
        stones: validated.stones as any,
        complexity,
        includeAIEstimate: true,
        // Use thumbnail URL for image-based analysis
        imageUrl: validated.thumbnailUrl,
      });
      
      estimatedPrice = priceBreakdown.total;
      
      // Use AI-estimated complexity if available
      if (priceBreakdown.aiEstimate?.confidence) {
        complexity = priceBreakdown.aiEstimate.complexity || complexity;
      }
      
      console.log(`[Save] Price calculated: ₪${estimatedPrice} (${complexity} complexity, source: ${priceBreakdown.metadata.laborSource})`);
    } catch (error) {
      console.error("Failed to calculate price:", error);
      // Continue without price - not a critical error
    }
    
    // Check if we're updating or creating
    if (validated.designId) {
      // Update existing design
      const design = await prisma.design.update({
        where: { id: validated.designId },
        data: {
          prompt: validated.prompt,
          jewelryType: validated.jewelryType,
          targetGender: validated.targetGender,
          material: validated.material,
          thumbnailUrl: validated.thumbnailUrl,
          modelUrl: validated.modelUrl,
          stones: validated.stones || [],
          complexity,
          estimatedPrice,
          chatHistory: validated.chatHistory || [],
          status: validated.status || "draft",
          name: validated.name,
          tripoTaskId: validated.tripoTaskId,
        },
      });
      
      return NextResponse.json({
        success: true,
        design,
        pricing: {
          estimatedPrice,
          complexity,
        },
      });
    } else {
      // Create new design
      const design = await prisma.design.create({
        data: {
          userId,
          prompt: validated.prompt,
          jewelryType: validated.jewelryType,
          targetGender: validated.targetGender,
          material: validated.material,
          thumbnailUrl: validated.thumbnailUrl,
          modelUrl: validated.modelUrl,
          stones: validated.stones || [],
          complexity,
          estimatedPrice,
          chatHistory: validated.chatHistory || [],
          status: validated.status || "draft",
          name: validated.name,
          tripoTaskId: validated.tripoTaskId,
        },
      });
      
      return NextResponse.json({
        success: true,
        design,
        pricing: {
          estimatedPrice,
          complexity,
        },
      });
    }
  } catch (error) {
    console.error("Save design error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    
    // Return more detailed error in development
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to save design",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

// GET - Fetch user's own designs
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const designs = await prisma.design.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({
      success: true,
      designs,
    });
  } catch (error) {
    console.error("Fetch designs error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch designs" },
      { status: 500 }
    );
  }
}
