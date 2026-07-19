/**
 * F7 — Ops Command Center shift briefing (operational intelligence & real-time
 * decision support). POST synthesizes the current incident log and simulated
 * crowd snapshot into a structured, zod-validated Gemini briefing. AI-limited.
 */
import { getGeminiService } from "@/lib/ai/gemini";
import { getCrowdSnapshot } from "@/lib/crowd/simulator";
import { enforceRateLimit, jsonResponse, toErrorResponse } from "@/lib/http/api";
import { listIncidents } from "@/lib/ops/incidents";
import { aiRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns a structured shift briefing over current incidents and crowd data. */
export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, aiRateLimiter);
    const gemini = getGeminiService();
    const briefing = await gemini.generateBriefing(listIncidents(), getCrowdSnapshot());
    return jsonResponse({ briefing, mocked: gemini.mocked });
  } catch (error) {
    return toErrorResponse(error);
  }
}
