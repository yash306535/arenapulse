/**
 * F5 — Transit & Parking Planner (transportation). POST plans a journey to the
 * venue via the server-side Google Maps service, computes when to leave/arrive
 * (kickoff minus a security buffer), and adds a Gemini departure-time tip. The
 * Maps key never reaches the client. AI-limited (Gemini + Maps upstream calls).
 */
import { getGeminiService } from "@/lib/ai/gemini";
import { getMapsService } from "@/lib/google/maps";
import {
  HttpError,
  enforceRateLimit,
  jsonResponse,
  readJsonBody,
  toErrorResponse,
} from "@/lib/http/api";
import { getMatch } from "@/lib/schedule";
import { aiRateLimiter } from "@/lib/security/rate-limit";
import { computeLeaveBy } from "@/lib/transit/advice";
import { transitRequestSchema } from "@/schemas/transit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns a journey plan, leave-by advice, and a natural-language tip. */
export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, aiRateLimiter);
    const body = await readJsonBody(request, transitRequestSchema);
    const match = getMatch(body.matchId);
    if (match === undefined) {
      throw new HttpError("not_found", 404, "That match could not be found.");
    }
    const maps = getMapsService();
    const gemini = getGeminiService();
    const plan = await maps.planJourney(body.origin, body.mode);
    const { arriveByIso, leaveByIso } = computeLeaveBy(match.kickoffIso, plan.totalDurationMinutes);
    const advice = await gemini.transitAdvice(plan, match.kickoffIso, leaveByIso);
    return jsonResponse({
      plan,
      advice,
      kickoffIso: match.kickoffIso,
      arriveByIso,
      leaveByIso,
      mocked: plan.mocked || gemini.mocked,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
