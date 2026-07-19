/**
 * F3 — Crowd management & real-time decision support. POST generates the
 * current simulated snapshot server-side and asks Gemini for structured,
 * zod-validated recommendations (alerts, gate reroutes, staffing moves). The
 * snapshot is computed here rather than trusted from the client. AI-limited.
 */
import { getGeminiService } from "@/lib/ai/gemini";
import { getCrowdSnapshot } from "@/lib/crowd/simulator";
import { enforceRateLimit, jsonResponse, toErrorResponse } from "@/lib/http/api";
import { aiRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the snapshot used plus AI decision-support recommendations. */
export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, aiRateLimiter);
    const gemini = getGeminiService();
    const snapshot = getCrowdSnapshot();
    const recommendation = await gemini.recommendCrowdActions(snapshot);
    return jsonResponse({ snapshot, recommendation, mocked: gemini.mocked });
  } catch (error) {
    return toErrorResponse(error);
  }
}
