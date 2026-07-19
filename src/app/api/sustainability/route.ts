/**
 * F6 — Sustainability Hub. POST computes a travel-mode carbon comparison for a
 * trip (pure math over the emission-factors fixture) and adds a personalized
 * Gemini sustainability tip. AI-limited.
 */
import { getGeminiService } from "@/lib/ai/gemini";
import { enforceRateLimit, jsonResponse, readJsonBody, toErrorResponse } from "@/lib/http/api";
import { aiRateLimiter } from "@/lib/security/rate-limit";
import { carbonFactorsNote, compareTravelModes } from "@/lib/sustainability/carbon";
import { sustainabilityTipRequestSchema } from "@/schemas/sustainability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the carbon comparison, disclosure note, and a tailored tip. */
export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, aiRateLimiter);
    const body = await readJsonBody(request, sustainabilityTipRequestSchema);
    const comparison = compareTravelModes(body.distanceKm);
    const gemini = getGeminiService();
    const tip = await gemini.sustainabilityTip(comparison, body.mode);
    return jsonResponse({ comparison, tip, note: carbonFactorsNote(), mocked: gemini.mocked });
  } catch (error) {
    return toErrorResponse(error);
  }
}
