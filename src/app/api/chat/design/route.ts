import { NextRequest, NextResponse } from "next/server";
import { getChatSession, deleteChatSession } from "@/lib/ai/claude";
import { z } from "zod";

const chatSchema = z.object({
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
  context: z
    .object({
      jewelryType: z.string(),
      gender: z.string().optional(),
      targetGender: z.string().optional(),
      style: z.string().optional(),
      material: z.string(),
      currentPrompt: z.string(),
      locale: z.enum(["en", "he"]).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = chatSchema.parse(body);

    const chatSession = getChatSession(validatedData.sessionId);

    // Set context if provided (typically on first message or when prompt changes)
    if (validatedData.context) {
      chatSession.setContext(validatedData.context);
    }

    // Get response from Claude - now returns structured response with potential new prompt
    const response = await chatSession.chat(validatedData.message);

    return NextResponse.json({
      success: true,
      message: response.message,
      newPrompt: response.newPrompt,
      shouldRegenerate: response.shouldRegenerate,
      history: chatSession.getHistory(),
    });
  } catch (error) {
    console.error("Chat error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to process message" },
      { status: 500 }
    );
  }
}

// Reset chat session
export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "Session ID is required" },
        { status: 400 }
      );
    }

    deleteChatSession(sessionId);

    return NextResponse.json({
      success: true,
      message: "Session deleted",
    });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
