import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAdminAuthenticated } from "@/lib/auth/admin";
import { calculatePriceAdvanced, type Stone } from "@/lib/pricing/calculator";

/**
 * Admin Designs API - Fetch all designs with detailed pricing breakdowns
 * 
 * Returns all designs created by users with:
 * - Full pricing breakdown
 * - User information
 * - Design status
 * - Conversion progress
 */

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const jewelryType = searchParams.get("jewelryType");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const includeBreakdown = searchParams.get("breakdown") === "true";
    
    // Build filter
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (jewelryType) where.jewelryType = jewelryType;
    
    // Fetch designs with user info
    let designs: Awaited<ReturnType<typeof prisma.design.findMany>> = [];
    let total = 0;
    
    try {
      [designs, total] = await Promise.all([
        prisma.design.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
            _count: {
              select: {
                orderItems: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
          skip: offset,
        }),
        prisma.design.count({ where }),
      ]);
    } catch (dbError) {
      console.error("Database query error:", dbError);
      // Return empty results if DB query fails
      return NextResponse.json({
        success: true,
        designs: [],
        stats: {
          total: 0,
          byStatus: { draft: 0, saved: 0, ordered: 0 },
          byType: { ring: 0, necklace: 0, bracelet: 0, earrings: 0 },
          totalEstimatedValue: 0,
          averagePrice: 0,
        },
        pagination: { total: 0, limit, offset, hasMore: false },
      });
    }
    
    // Calculate detailed pricing breakdowns if requested and there are designs
    let designsWithBreakdowns: typeof designs & { pricingBreakdown?: unknown }[] = designs;
    
    if (includeBreakdown && designs.length > 0) {
      designsWithBreakdowns = await Promise.all(
        designs.map(async (design) => {
          try {
            const breakdown = await calculatePriceAdvanced({
              material: design.material as "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum",
              jewelryType: design.jewelryType as "ring" | "necklace" | "bracelet" | "earrings",
              description: design.prompt,
              size: "medium",
              stones: (design.stones as unknown as Stone[]) || [],
              complexity: design.complexity as "simple" | "moderate" | "complex" | "master",
              includeAIEstimate: false, // Skip text-based AI estimate to speed things up
              imageUrl: design.thumbnailUrl || undefined, // Use image analysis if available
            });
            
            return {
              ...design,
              pricingBreakdown: breakdown,
            };
          } catch (error) {
            console.error(`Failed to calculate price for design ${design.id}:`, error);
            return {
              ...design,
              pricingBreakdown: null,
            };
          }
        })
      );
    }
    
    // Calculate summary stats
    const designsWithPrice = designs.filter(d => d.estimatedPrice && d.estimatedPrice > 0);
    const totalEstimatedValue = designs.reduce((sum, d) => sum + (d.estimatedPrice || 0), 0);
    
    // Get stats in parallel, with fallback to 0 on error
    const [draftCount, savedCount, orderedCount, ringCount, necklaceCount, braceletCount, earringsCount] = await Promise.all([
      prisma.design.count({ where: { ...where, status: "draft" } }).catch(() => 0),
      prisma.design.count({ where: { ...where, status: "saved" } }).catch(() => 0),
      prisma.design.count({ where: { ...where, status: "ordered" } }).catch(() => 0),
      prisma.design.count({ where: { ...where, jewelryType: "ring" } }).catch(() => 0),
      prisma.design.count({ where: { ...where, jewelryType: "necklace" } }).catch(() => 0),
      prisma.design.count({ where: { ...where, jewelryType: "bracelet" } }).catch(() => 0),
      prisma.design.count({ where: { ...where, jewelryType: "earrings" } }).catch(() => 0),
    ]);
    
    const stats = {
      total,
      byStatus: {
        draft: draftCount,
        saved: savedCount,
        ordered: orderedCount,
      },
      byType: {
        ring: ringCount,
        necklace: necklaceCount,
        bracelet: braceletCount,
        earrings: earringsCount,
      },
      totalEstimatedValue,
      averagePrice: designsWithPrice.length > 0 
        ? totalEstimatedValue / designsWithPrice.length
        : 0,
    };
    
    return NextResponse.json({
      success: true,
      designs: designsWithBreakdowns,
      stats,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + designs.length < total,
      },
    });
  } catch (error) {
    console.error("Admin designs fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `Failed to fetch designs: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// POST - Recalculate pricing for a specific design
export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin authentication required" },
        { status: 401 }
      );
    }
    
    const { designId, action } = await request.json();
    
    if (action === "recalculate") {
      const design = await prisma.design.findUnique({
        where: { id: designId },
      });
      
      if (!design) {
        return NextResponse.json(
          { success: false, error: "Design not found" },
          { status: 404 }
        );
      }
      
      // Recalculate pricing with image analysis
      const breakdown = await calculatePriceAdvanced({
        material: design.material as any,
        jewelryType: design.jewelryType as any,
        description: design.prompt,
        size: "medium",
        stones: (design.stones as any[]) || [],
        complexity: design.complexity as any,
        includeAIEstimate: true,
        // Use thumbnail for image-based analysis
        imageUrl: design.thumbnailUrl || undefined,
      });
      
      // Update the design with new price
      const updatedDesign = await prisma.design.update({
        where: { id: designId },
        data: {
          estimatedPrice: breakdown.total,
          complexity: breakdown.aiEstimate?.complexity || design.complexity,
        },
      });
      
      return NextResponse.json({
        success: true,
        design: updatedDesign,
        breakdown,
      });
    }
    
    return NextResponse.json(
      { success: false, error: "Unknown action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin design action error:", error);
    return NextResponse.json(
      { success: false, error: "Action failed" },
      { status: 500 }
    );
  }
}
