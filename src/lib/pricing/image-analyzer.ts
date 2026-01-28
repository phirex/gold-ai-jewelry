/**
 * Jewelry Image Analyzer
 * 
 * Uses Claude Vision API to analyze generated jewelry images and extract
 * pricing-relevant characteristics like weight, stones, complexity, etc.
 */

import Anthropic from "@anthropic-ai/sdk";
import { priceCache, CACHE_KEYS, TTL, hashString } from "./cache";

/**
 * Detected stone in the jewelry image
 */
export interface DetectedStone {
  type: "diamond" | "sapphire" | "ruby" | "emerald" | "opal" | "pearl" | "amethyst" | "topaz" | "other";
  estimatedSize: "tiny" | "small" | "medium" | "large" | "statement";
  count: number;
  settingType?: "prong" | "bezel" | "channel" | "pave" | "tension" | "flush" | "unknown";
}

/**
 * Result of image analysis
 */
export interface ImageAnalysisResult {
  // Weight estimation
  weightCategory: "ultralight" | "light" | "medium" | "heavy" | "substantial";
  volumeMultiplier: number; // 0.5 (very thin/delicate) to 2.5 (chunky/substantial)
  
  // Stones detected
  stonesDetected: DetectedStone[];
  totalStoneCount: number;
  
  // Complexity assessment
  complexity: "simple" | "moderate" | "complex" | "master";
  complexityScore: number; // 1-10 scale
  
  // Design characteristics
  designCharacteristics: {
    isHollow: boolean;
    hasFiligree: boolean;
    hasEngraving: boolean;
    hasMicroDetails: boolean;
    hasMultipleParts: boolean;
    surfaceTexture: "polished" | "matte" | "textured" | "mixed";
  };
  
  // Labor factors
  laborFactors: string[];
  estimatedLaborHours: number;
  
  // AI confidence
  confidence: number; // 0-1
  reasoning: string;
  
  // Raw description for debugging
  rawDescription: string;
}

/**
 * Claude client for image analysis
 */
let claudeClient: Anthropic | null = null;

function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    claudeClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return claudeClient;
}

/**
 * System prompt for jewelry image analysis
 */
const IMAGE_ANALYSIS_PROMPT = `You are an expert jewelry appraiser and gemologist with 30+ years of experience.
Your task is to analyze a jewelry image and estimate its physical characteristics for pricing purposes.

Analyze the image and provide accurate estimates for:

1. **Weight/Volume Assessment**
   - Consider: Is this piece thick/chunky or thin/delicate?
   - Is it solid or hollow? (hollow pieces weigh ~40% less)
   - What's the overall material volume compared to a standard piece?

2. **Stone Detection**
   - Count visible stones and estimate their sizes
   - Identify stone types (diamond, sapphire, ruby, emerald, opal, pearl, etc.)
   - Note the setting style (prong, bezel, channel, pave, etc.)

3. **Complexity Assessment**
   - Simple: Basic shapes, minimal detail, standard construction
   - Moderate: Some custom elements, basic stone setting, standard finishing
   - Complex: Intricate patterns, multiple stones, detailed work
   - Master: Exceptional craftsmanship, micro-pave, hand engraving, filigree

4. **Labor Factors**
   - List specific techniques visible (filigree, engraving, pave setting, etc.)
   - Estimate hours needed for an experienced jeweler

Volume Multipliers Guide:
- 0.5-0.7: Very thin/delicate pieces (thin bands, delicate chains)
- 0.8-1.0: Standard/average pieces
- 1.1-1.5: Substantial/bold pieces
- 1.6-2.0: Chunky/heavy pieces
- 2.1-2.5: Exceptionally substantial pieces

Respond ONLY with valid JSON in this exact format:
{
  "weightCategory": "ultralight|light|medium|heavy|substantial",
  "volumeMultiplier": <number 0.5-2.5>,
  "stonesDetected": [
    {
      "type": "diamond|sapphire|ruby|emerald|opal|pearl|amethyst|topaz|other",
      "estimatedSize": "tiny|small|medium|large|statement",
      "count": <number>,
      "settingType": "prong|bezel|channel|pave|tension|flush|unknown"
    }
  ],
  "complexity": "simple|moderate|complex|master",
  "complexityScore": <1-10>,
  "designCharacteristics": {
    "isHollow": <boolean>,
    "hasFiligree": <boolean>,
    "hasEngraving": <boolean>,
    "hasMicroDetails": <boolean>,
    "hasMultipleParts": <boolean>,
    "surfaceTexture": "polished|matte|textured|mixed"
  },
  "laborFactors": ["<factor1>", "<factor2>", ...],
  "estimatedLaborHours": <number>,
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation of your assessment>"
}`;

/**
 * Download image and convert to base64
 */
async function imageUrlToBase64(imageUrl: string): Promise<{ data: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" }> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  
  // Map content type to Anthropic's expected format
  let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
  if (contentType.includes("png")) mediaType = "image/png";
  else if (contentType.includes("gif")) mediaType = "image/gif";
  else if (contentType.includes("webp")) mediaType = "image/webp";
  
  return { data: base64, mediaType };
}

/**
 * Analyze a jewelry image using Claude Vision
 */
export async function analyzeJewelryImage(
  imageUrl: string,
  context?: {
    jewelryType?: string;
    material?: string;
    userDescription?: string;
  }
): Promise<ImageAnalysisResult> {
  // Create cache key from image URL
  const cacheKey = CACHE_KEYS.LABOR_ESTIMATE(hashString(imageUrl));
  
  // Check cache first
  const cached = priceCache.get<ImageAnalysisResult>(cacheKey);
  if (cached) {
    return cached;
  }
  
  const client = getClaudeClient();
  
  // Convert image to base64
  const { data: base64Image, mediaType } = await imageUrlToBase64(imageUrl);
  
  // Build context message
  let contextMessage = "Analyze this jewelry image for pricing estimation.";
  if (context) {
    const parts = [];
    if (context.jewelryType) parts.push(`Type: ${context.jewelryType}`);
    if (context.material) parts.push(`Material: ${context.material}`);
    if (context.userDescription) parts.push(`User's description: "${context.userDescription}"`);
    if (parts.length > 0) {
      contextMessage += `\n\nContext:\n${parts.join("\n")}`;
    }
  }
  
  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: IMAGE_ANALYSIS_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: contextMessage,
            },
          ],
        },
      ],
    });
    
    const rawResponse = response.content[0].type === "text" ? response.content[0].text : "";
    
    // Parse JSON response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and normalize response
    const result: ImageAnalysisResult = {
      weightCategory: validateWeightCategory(parsed.weightCategory),
      volumeMultiplier: Math.max(0.5, Math.min(2.5, Number(parsed.volumeMultiplier) || 1.0)),
      stonesDetected: normalizeStones(parsed.stonesDetected),
      totalStoneCount: countTotalStones(parsed.stonesDetected),
      complexity: validateComplexity(parsed.complexity),
      complexityScore: Math.max(1, Math.min(10, Number(parsed.complexityScore) || 5)),
      designCharacteristics: {
        isHollow: Boolean(parsed.designCharacteristics?.isHollow),
        hasFiligree: Boolean(parsed.designCharacteristics?.hasFiligree),
        hasEngraving: Boolean(parsed.designCharacteristics?.hasEngraving),
        hasMicroDetails: Boolean(parsed.designCharacteristics?.hasMicroDetails),
        hasMultipleParts: Boolean(parsed.designCharacteristics?.hasMultipleParts),
        surfaceTexture: validateSurfaceTexture(parsed.designCharacteristics?.surfaceTexture),
      },
      laborFactors: Array.isArray(parsed.laborFactors) ? parsed.laborFactors : [],
      estimatedLaborHours: Math.max(1, Number(parsed.estimatedLaborHours) || 4),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7)),
      reasoning: String(parsed.reasoning || "Image analyzed for pricing"),
      rawDescription: rawResponse,
    };
    
    // Cache the result
    priceCache.set(cacheKey, result, { ttlMs: TTL.LABOR });
    
    return result;
  } catch (error) {
    console.error("[ImageAnalyzer] Analysis failed:", error);
    // Return fallback estimate
    return getDefaultAnalysis();
  }
}

/**
 * Validation helpers
 */
function validateWeightCategory(value: unknown): ImageAnalysisResult["weightCategory"] {
  const valid = ["ultralight", "light", "medium", "heavy", "substantial"];
  return valid.includes(String(value)) ? (value as ImageAnalysisResult["weightCategory"]) : "medium";
}

function validateComplexity(value: unknown): ImageAnalysisResult["complexity"] {
  const valid = ["simple", "moderate", "complex", "master"];
  return valid.includes(String(value)) ? (value as ImageAnalysisResult["complexity"]) : "moderate";
}

function validateSurfaceTexture(value: unknown): ImageAnalysisResult["designCharacteristics"]["surfaceTexture"] {
  const valid = ["polished", "matte", "textured", "mixed"];
  return valid.includes(String(value)) ? (value as ImageAnalysisResult["designCharacteristics"]["surfaceTexture"]) : "polished";
}

function normalizeStones(stones: unknown): DetectedStone[] {
  if (!Array.isArray(stones)) return [];
  
  return stones.map((stone: Record<string, unknown>) => ({
    type: validateStoneType(stone.type),
    estimatedSize: validateStoneSize(stone.estimatedSize),
    count: Math.max(1, Number(stone.count) || 1),
    settingType: validateSettingType(stone.settingType),
  }));
}

function validateStoneType(value: unknown): DetectedStone["type"] {
  const valid = ["diamond", "sapphire", "ruby", "emerald", "opal", "pearl", "amethyst", "topaz", "other"];
  return valid.includes(String(value)) ? (value as DetectedStone["type"]) : "other";
}

function validateStoneSize(value: unknown): DetectedStone["estimatedSize"] {
  const valid = ["tiny", "small", "medium", "large", "statement"];
  return valid.includes(String(value)) ? (value as DetectedStone["estimatedSize"]) : "small";
}

function validateSettingType(value: unknown): DetectedStone["settingType"] {
  const valid = ["prong", "bezel", "channel", "pave", "tension", "flush", "unknown"];
  return valid.includes(String(value)) ? (value as DetectedStone["settingType"]) : "unknown";
}

function countTotalStones(stones: unknown): number {
  if (!Array.isArray(stones)) return 0;
  return stones.reduce((sum, stone: Record<string, unknown>) => sum + (Number(stone.count) || 1), 0);
}

/**
 * Default analysis when vision fails
 */
function getDefaultAnalysis(): ImageAnalysisResult {
  return {
    weightCategory: "medium",
    volumeMultiplier: 1.0,
    stonesDetected: [],
    totalStoneCount: 0,
    complexity: "moderate",
    complexityScore: 5,
    designCharacteristics: {
      isHollow: false,
      hasFiligree: false,
      hasEngraving: false,
      hasMicroDetails: false,
      hasMultipleParts: false,
      surfaceTexture: "polished",
    },
    laborFactors: [],
    estimatedLaborHours: 4,
    confidence: 0.3,
    reasoning: "Default estimate - image analysis unavailable",
    rawDescription: "",
  };
}

/**
 * Convert analysis result to pricing inputs
 */
export function analysisToStones(analysis: ImageAnalysisResult): Array<{
  type: "diamond" | "sapphire" | "ruby" | "emerald";
  size: "tiny" | "small" | "medium" | "large" | "statement";
  quantity: number;
  quality?: "economy" | "standard" | "premium" | "luxury";
}> {
  return analysis.stonesDetected
    .filter(stone => ["diamond", "sapphire", "ruby", "emerald"].includes(stone.type))
    .map(stone => ({
      type: stone.type as "diamond" | "sapphire" | "ruby" | "emerald",
      size: stone.estimatedSize,
      quantity: stone.count,
      quality: "standard" as const,
    }));
}

/**
 * Calculate volume adjustment based on analysis
 */
export function getVolumeAdjustment(analysis: ImageAnalysisResult): number {
  let adjustment = analysis.volumeMultiplier;
  
  // If hollow, reduce effective volume by 40%
  if (analysis.designCharacteristics.isHollow) {
    adjustment *= 0.6;
  }
  
  return adjustment;
}
