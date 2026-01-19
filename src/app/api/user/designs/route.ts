import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db/prisma";
import { authOptions } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const designs = await prisma.design.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        thumbnailUrl: true,
        jewelryType: true,
        material: true,
        estimatedPrice: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      designs,
    });
  } catch (error) {
    console.error("Failed to fetch designs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch designs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const design = await prisma.design.create({
      data: {
        userId: user.id,
        name: body.name,
        prompt: body.prompt,
        chatHistory: body.chatHistory || [],
        modelUrl: body.modelUrl,
        thumbnailUrl: body.thumbnailUrl,
        jewelryType: body.jewelryType,
        targetGender: body.targetGender,
        material: body.material,
        stones: body.stones || [],
        volumeCm3: body.volumeCm3,
        weightGrams: body.weightGrams,
        estimatedPrice: body.estimatedPrice,
        complexity: body.complexity || "moderate",
        status: "saved",
      },
    });

    return NextResponse.json({
      success: true,
      design,
    });
  } catch (error) {
    console.error("Failed to save design:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save design" },
      { status: 500 }
    );
  }
}
