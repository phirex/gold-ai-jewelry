/**
 * Claude API Client for Design Chat
 *
 * Uses the Anthropic SDK for conversational design refinement.
 * Supports Hebrew and English, and returns updated prompts for regeneration.
 */

import Anthropic from "@anthropic-ai/sdk";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DesignContext {
  jewelryType: string;
  targetGender: string;
  style: string;
  material: string;
  currentPrompt: string;
  locale?: "en" | "he";
}

export interface ChatResponse {
  message: string;
  newPrompt: string | null;
  shouldRegenerate: boolean;
}

function getSystemPrompt(locale: string, context: DesignContext | null): string {
  const isHebrew = locale === "he";

  const jewelryInfo = context ? `
Current design:
- Type: ${context.jewelryType}
- Style: ${context.style}
- Material: ${context.material}
- Target: ${context.targetGender}
- Description: "${context.currentPrompt}"
` : "";

  if (isHebrew) {
    return `אתה מעצב תכשיטים מקצועי. אתה עוזר ללקוחות לשפר את עיצובי התכשיטים שלהם.

${jewelryInfo}

כשהלקוח מבקש שינוי בעיצוב:
1. הבן את הבקשה
2. צור תיאור עיצוב חדש ומפורט באנגלית (לצורך יצירת המודל התלת-ממדי)
3. ענה ללקוח בעברית והסבר מה שינית

פורמט התשובה שלך חייב להיות JSON:
{
  "message": "התשובה שלך ללקוח בעברית - קצר וברור",
  "newPrompt": "תיאור מפורט באנגלית של התכשיט עם השינויים. תאר: צורה, מרקם, גודל, פרופורציות, סגנון מתכת, פרטים ספציפיים. התכשיט חייב להיראות ריאליסטי כמו תמונת מוצר מקצועית של תכשיט אמיתי.",
  "shouldRegenerate": true
}

חשוב מאוד:
- ה-newPrompt חייב להיות באנגלית ומפורט מאוד
- תאר תכשיט ריאליסטי ומקצועי, לא קריקטורה
- כלול פרטים על: חיתוכים, גימור המתכת, הברקה, פרופורציות מדויקות
- אם הלקוח שואל שאלה בלבד (לא מבקש שינוי), החזר shouldRegenerate: false`;
  }

  return `You are a professional jewelry designer assistant helping customers refine their jewelry designs.

${jewelryInfo}

When the customer requests a design modification:
1. Understand their request
2. Create a detailed new design description in English for 3D generation
3. Respond to the customer explaining what you changed

Your response must be JSON:
{
  "message": "Your response to the customer - brief and clear",
  "newPrompt": "Detailed English description of the jewelry with changes. Describe: shape, texture, size, proportions, metal finish, specific details. The jewelry must look realistic like a professional product photo of real jewelry.",
  "shouldRegenerate": true
}

Important:
- The newPrompt must be very detailed in English
- Describe realistic, professional jewelry, not cartoonish
- Include details about: cuts, metal finish, shine, exact proportions
- If the customer only asks a question (not requesting changes), return shouldRegenerate: false`;
}

export class ClaudeDesignChat {
  private client: Anthropic;
  private conversationHistory: ChatMessage[] = [];
  private context: DesignContext | null = null;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Set the design context for more relevant responses
   */
  setContext(context: DesignContext) {
    this.context = context;
  }

  /**
   * Update the current prompt in context
   */
  updatePrompt(newPrompt: string) {
    if (this.context) {
      this.context.currentPrompt = newPrompt;
    }
  }

  /**
   * Send a message and get a response with potential new prompt
   */
  async chat(userMessage: string): Promise<ChatResponse> {
    const locale = this.context?.locale || "en";

    // Add user message to history
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    try {
      const response = await this.client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: getSystemPrompt(locale, this.context),
        messages: this.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      });

      // Extract text from response
      const rawResponse =
        response.content[0].type === "text"
          ? response.content[0].text
          : '{"message": "I apologize, but I couldn\'t process that request.", "newPrompt": null, "shouldRegenerate": false}';

      // Try to parse JSON response
      let parsedResponse: ChatResponse;
      try {
        const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          parsedResponse = {
            message: parsed.message || rawResponse,
            newPrompt: parsed.newPrompt || null,
            shouldRegenerate: parsed.shouldRegenerate ?? false,
          };
        } else {
          parsedResponse = {
            message: rawResponse,
            newPrompt: null,
            shouldRegenerate: false,
          };
        }
      } catch {
        parsedResponse = {
          message: rawResponse,
          newPrompt: null,
          shouldRegenerate: false,
        };
      }

      // Add assistant response to history (just the message part)
      this.conversationHistory.push({
        role: "assistant",
        content: parsedResponse.message,
      });

      // Update context with new prompt if regenerating
      if (parsedResponse.shouldRegenerate && parsedResponse.newPrompt && this.context) {
        this.context.currentPrompt = parsedResponse.newPrompt;
      }

      return parsedResponse;
    } catch (error) {
      console.error("Claude API error:", error);
      throw new Error("Failed to get response from design assistant");
    }
  }

  /**
   * Reset the conversation
   */
  reset() {
    this.conversationHistory = [];
    this.context = null;
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
}

// Session management for chat instances
const chatSessions = new Map<string, ClaudeDesignChat>();

export function getChatSession(sessionId: string): ClaudeDesignChat {
  if (!chatSessions.has(sessionId)) {
    chatSessions.set(sessionId, new ClaudeDesignChat());
  }
  return chatSessions.get(sessionId)!;
}

export function deleteChatSession(sessionId: string): void {
  chatSessions.delete(sessionId);
}
