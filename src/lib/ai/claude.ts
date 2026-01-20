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
  targetGender?: string;
  gender?: string;
  style?: string;
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

  const genderValue = context?.targetGender || context?.gender || "unisex";
  const styleValue = context?.style || "modern";
  const jewelryInfo = context ? `
Current design:
- Type: ${context.jewelryType}
- Style: ${styleValue}
- Material: ${context.material}
- Target: ${genderValue}
- Description: "${context.currentPrompt}"
` : "";

  if (isHebrew) {
    return `אתה מעצב תכשיטים מקצועי. אתה עוזר ללקוחות לשפר את עיצובי התכשיטים שלהם.

${jewelryInfo}

כשהלקוח מבקש שינוי בעיצוב:
1. הבן את הבקשה
2. צור תיאור עיצוב חדש ומפורט מאוד באנגלית - זה קריטי!
3. ענה ללקוח בעברית והסבר מה שינית

פורמט התשובה שלך חייב להיות JSON:
{
  "message": "התשובה שלך ללקוח בעברית - קצר וברור",
  "newPrompt": "FULL DETAILED ENGLISH DESCRIPTION - see rules below",
  "shouldRegenerate": true
}

חוקים קריטיים ל-newPrompt (חייב להיות באנגלית!):
1. תאר את התכשיט השלם מההתחלה - לא רק את השינוי
2. התחל עם סוג התכשיט והחומר: "Elegant thin 18K yellow gold ring..."
3. תאר מידות ספציפיות: "2mm band width", "delicate thin band", "thick substantial band"
4. תאר את הגימור: "highly polished mirror finish", "brushed matte texture"
5. תאר את הצורה: "round band", "squared edges", "curved organic form"
6. הדגש את השינוי המבוקש בתיאור!
7. סיים עם: "professional jewelry product photography, white background, studio lighting"

דוגמאות טובות:
- לבקשה "יותר דק": "Delicate thin 18K yellow gold ring with very narrow 1.5mm band width, sleek minimalist design, highly polished surface reflecting light, elegant slim profile, professional jewelry product photography, white background, studio lighting"
- לבקשה "יותר עבה": "Substantial bold 18K yellow gold ring with wide 6mm band, chunky statement design, polished finish, prominent presence, professional jewelry product photography"
- לבקשה "הוסף יהלומים": "Elegant 18K yellow gold ring with channel-set row of small brilliant round diamonds along the band, sparkling gemstones, polished gold setting, professional jewelry product photography"

אם הלקוח שואל שאלה בלבד (לא מבקש שינוי), החזר shouldRegenerate: false`;
  }

  return `You are a professional jewelry designer assistant helping customers refine their jewelry designs.

${jewelryInfo}

When the customer requests a design modification:
1. Understand their request
2. Create a COMPLETE, DETAILED new design description in English - this is critical!
3. Respond to the customer explaining what you changed

Your response must be JSON:
{
  "message": "Your response to the customer - brief and clear",
  "newPrompt": "FULL DETAILED ENGLISH DESCRIPTION - see rules below",
  "shouldRegenerate": true
}

CRITICAL rules for newPrompt:
1. Describe the COMPLETE jewelry from scratch - not just the change
2. Start with jewelry type and material: "Elegant thin 18K yellow gold ring..."
3. Include specific dimensions: "2mm band width", "delicate thin band", "thick substantial band"
4. Describe the finish: "highly polished mirror finish", "brushed matte texture"
5. Describe the shape: "round band", "squared edges", "curved organic form"
6. EMPHASIZE the requested change prominently in the description!
7. End with: "professional jewelry product photography, white background, studio lighting"

GOOD examples:
- For "thinner": "Delicate thin 18K yellow gold ring with very narrow 1.5mm band width, sleek minimalist design, highly polished surface reflecting light, elegant slim profile, professional jewelry product photography, white background, studio lighting"
- For "thicker": "Substantial bold 18K yellow gold ring with wide 6mm band, chunky statement design, polished finish, prominent presence, professional jewelry product photography"
- For "add diamonds": "Elegant 18K yellow gold ring with channel-set row of small brilliant round diamonds along the band, sparkling gemstones, polished gold setting, professional jewelry product photography"

If the customer only asks a question (not requesting changes), return shouldRegenerate: false`;
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
