/**
 * AI-Powered Labor Cost Estimator
 *
 * Uses Claude to analyze jewelry design descriptions and estimate
 * the complexity and labor hours required for craftsmanship.
 */

import Anthropic from "@anthropic-ai/sdk";
import { priceCache, CACHE_KEYS, TTL, hashString } from "./cache";

// Labor complexity levels
export type ComplexityLevel = "simple" | "moderate" | "complex" | "master";

/**
 * Labor estimate result
 */
export interface LaborEstimate {
  hours: number; // Estimated craftsmanship hours
  complexity: ComplexityLevel;
  reasoning: string; // AI explanation of the estimate
  confidence: number; // 0-1 confidence score
  factors: string[]; // Key factors affecting the estimate
  hourlyRateILS: number; // Recommended hourly rate
  totalLaborILS: number; // Total labor cost
}

/**
 * Design input for labor estimation
 */
export interface DesignInput {
  description: string;
  jewelryType: "ring" | "necklace" | "bracelet" | "earrings";
  material: "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum";
  hasStones?: boolean;
  stoneCount?: number;
}

// Base hourly rates by complexity (ILS)
const HOURLY_RATES: Record<ComplexityLevel, number> = {
  simple: 150, // Simple, standard pieces
  moderate: 200, // Some custom work
  complex: 280, // Significant custom craftsmanship
  master: 400, // Master jeweler level work
};

// Base hours by jewelry type
const BASE_HOURS: Record<string, number> = {
  ring: 3,
  necklace: 5,
  bracelet: 4,
  earrings: 4, // Per pair
};

/**
 * Claude client for labor estimation
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
 * System prompt for labor estimation
 */
const LABOR_ESTIMATION_PROMPT = `You are an expert jewelry craftsman and cost estimator with 30+ years of experience.

Your task is to analyze a jewelry design description and estimate the labor required to craft it.

Consider these factors:
1. Structural complexity (basic band vs. intricate filigree)
2. Stone setting requirements (prong, bezel, channel, pave, etc.)
3. Surface finishing (polishing, texturing, engraving)
4. Assembly complexity (soldering, chain assembly)
5. Precision requirements (tight tolerances, delicate work)
6. Material challenges (platinum is harder to work than gold)

Complexity levels:
- "simple": Basic designs, standard shapes, minimal customization (1-3 hours)
- "moderate": Some custom elements, basic stone setting, standard finishing (3-6 hours)
- "complex": Intricate designs, multiple stones, custom shapes, detailed finishing (6-12 hours)
- "master": Exceptional craftsmanship, complex stone patterns, micro-pave, hand engraving (12-30+ hours)

Respond ONLY with valid JSON in this exact format:
{
  "hours": <number>,
  "complexity": "<simple|moderate|complex|master>",
  "reasoning": "<brief explanation of your estimate>",
  "confidence": <0.0 to 1.0>,
  "factors": ["<factor1>", "<factor2>", "<factor3>"]
}`;

/**
 * Estimate labor using Claude AI
 */
async function estimateWithAI(input: DesignInput): Promise<LaborEstimate> {
  const client = getClaudeClient();

  const userPrompt = `Estimate the labor for this jewelry piece:

Type: ${input.jewelryType}
Material: ${input.material.replace("_", " ")}
${input.hasStones ? `Stones: ${input.stoneCount ?? "some"} stones` : "No stones"}

Design Description:
"${input.description}"

Provide your labor estimate as JSON.`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: LABOR_ESTIMATION_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const rawResponse =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse JSON response
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate and normalize the response
    const complexity = validateComplexity(parsed.complexity);
    const hours = Math.max(1, Math.min(40, Number(parsed.hours) || BASE_HOURS[input.jewelryType]));
    const confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0.7));

    const hourlyRate = HOURLY_RATES[complexity];
    const totalLabor = Math.round(hours * hourlyRate);

    return {
      hours,
      complexity,
      reasoning: String(parsed.reasoning || "AI estimate based on design complexity"),
      confidence,
      factors: Array.isArray(parsed.factors) ? parsed.factors.slice(0, 5) : [],
      hourlyRateILS: hourlyRate,
      totalLaborILS: totalLabor,
    };
  } catch (error) {
    console.error("[LaborEstimator] AI estimation failed:", error);
    // Fall back to rule-based estimation
    return estimateWithRules(input);
  }
}

/**
 * Validate complexity level
 */
function validateComplexity(value: unknown): ComplexityLevel {
  const valid: ComplexityLevel[] = ["simple", "moderate", "complex", "master"];
  if (typeof value === "string" && valid.includes(value as ComplexityLevel)) {
    return value as ComplexityLevel;
  }
  return "moderate";
}

/**
 * Rule-based fallback estimation
 */
function estimateWithRules(input: DesignInput): LaborEstimate {
  let hours = BASE_HOURS[input.jewelryType] || 3;
  let complexity: ComplexityLevel = "moderate";
  const factors: string[] = [];

  const desc = input.description.toLowerCase();

  // Complexity indicators in description
  const simpleIndicators = ["simple", "plain", "basic", "minimalist", "clean"];
  const complexIndicators = [
    "intricate",
    "detailed",
    "filigree",
    "engraved",
    "vintage",
    "antique",
    "ornate",
  ];
  const masterIndicators = [
    "master",
    "exceptional",
    "micro-pave",
    "hand-carved",
    "custom",
    "bespoke",
  ];

  if (simpleIndicators.some((i) => desc.includes(i))) {
    complexity = "simple";
    hours *= 0.7;
    factors.push("Simple design elements");
  } else if (masterIndicators.some((i) => desc.includes(i))) {
    complexity = "master";
    hours *= 2.5;
    factors.push("Master-level craftsmanship required");
  } else if (complexIndicators.some((i) => desc.includes(i))) {
    complexity = "complex";
    hours *= 1.8;
    factors.push("Intricate design details");
  }

  // Stone setting adjustments
  if (input.hasStones || desc.includes("diamond") || desc.includes("stone")) {
    const stoneCount = input.stoneCount || 1;
    if (stoneCount > 10) {
      hours += stoneCount * 0.3;
      factors.push(`Multiple stone settings (${stoneCount})`);
      if (complexity === "simple") complexity = "moderate";
    } else if (stoneCount > 1) {
      hours += stoneCount * 0.5;
      factors.push(`Stone setting (${stoneCount} stones)`);
    } else {
      hours += 1;
      factors.push("Single stone setting");
    }
  }

  // Material adjustments
  if (input.material === "platinum") {
    hours *= 1.3;
    factors.push("Platinum (harder to work)");
  } else if (input.material === "gold_24k") {
    hours *= 1.1;
    factors.push("24K gold (soft, requires care)");
  }

  // Jewelry type specifics
  if (input.jewelryType === "necklace" && desc.includes("chain")) {
    hours += 1;
    factors.push("Chain assembly");
  }
  if (desc.includes("pave") || desc.includes("pavé")) {
    hours *= 1.5;
    if (complexity !== "master") complexity = "complex";
    factors.push("Pavé setting technique");
  }

  hours = Math.round(hours * 10) / 10;
  const hourlyRate = HOURLY_RATES[complexity];

  return {
    hours,
    complexity,
    reasoning: `Rule-based estimate: ${input.jewelryType} with ${complexity} complexity`,
    confidence: 0.65,
    factors,
    hourlyRateILS: hourlyRate,
    totalLaborILS: Math.round(hours * hourlyRate),
  };
}

/**
 * Get labor estimate with caching
 *
 * Caches estimates by description hash to avoid redundant API calls
 */
export async function estimateLabor(input: DesignInput): Promise<LaborEstimate> {
  // Create cache key from input
  const inputHash = hashString(
    `${input.description}_${input.jewelryType}_${input.material}_${input.hasStones}_${input.stoneCount}`
  );
  const cacheKey = CACHE_KEYS.LABOR_ESTIMATE(inputHash);

  // Check cache first
  const cached = priceCache.get<LaborEstimate>(cacheKey);
  if (cached) {
    return cached;
  }

  // Check if we have Anthropic API key
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;

  let estimate: LaborEstimate;
  if (hasApiKey) {
    estimate = await estimateWithAI(input);
  } else {
    estimate = estimateWithRules(input);
  }

  // Cache the result
  priceCache.set(cacheKey, estimate, { ttlMs: TTL.LABOR });

  return estimate;
}

/**
 * Quick estimate without AI (for real-time UI updates)
 */
export function quickLaborEstimate(
  jewelryType: string,
  complexity: ComplexityLevel = "moderate",
  hasStones: boolean = false
): { hours: number; totalILS: number } {
  let hours = BASE_HOURS[jewelryType] || 3;

  // Complexity multiplier
  const multipliers: Record<ComplexityLevel, number> = {
    simple: 0.7,
    moderate: 1.0,
    complex: 1.8,
    master: 2.5,
  };
  hours *= multipliers[complexity];

  // Stone adjustment
  if (hasStones) {
    hours += 1.5;
  }

  const hourlyRate = HOURLY_RATES[complexity];
  return {
    hours: Math.round(hours * 10) / 10,
    totalILS: Math.round(hours * hourlyRate),
  };
}

/**
 * Get labor cost breakdown for display
 */
export function getLaborBreakdown(estimate: LaborEstimate): {
  baseLabel: string;
  hours: string;
  rate: string;
  total: string;
} {
  return {
    baseLabel: `${estimate.complexity.charAt(0).toUpperCase() + estimate.complexity.slice(1)} Craftsmanship`,
    hours: `${estimate.hours} hours`,
    rate: `₪${estimate.hourlyRateILS}/hr`,
    total: `₪${estimate.totalLaborILS.toLocaleString()}`,
  };
}
