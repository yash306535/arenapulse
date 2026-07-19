/**
 * F2 — Smart Stadium Navigation. POST computes the shortest route across the
 * stadium graph (optionally step-free for accessibility, F4) and asks Gemini
 * to narrate the verified steps in the user's language. Returns 422 when no
 * route exists under the given constraints. AI-limited.
 */
import { getGeminiService } from "@/lib/ai/gemini";
import {
  HttpError,
  enforceRateLimit,
  jsonResponse,
  readJsonBody,
  toErrorResponse,
} from "@/lib/http/api";
import { findRoute } from "@/lib/navigation/pathfinder";
import { aiRateLimiter } from "@/lib/security/rate-limit";
import { getStadiumGraph } from "@/lib/stadium";
import { directionsRequestSchema } from "@/schemas/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the computed route plus a natural-language narration. */
export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, aiRateLimiter);
    const body = await readJsonBody(request, directionsRequestSchema);
    const route = findRoute(getStadiumGraph(), {
      originId: body.originId,
      destinationId: body.destinationId,
      stepFreeOnly: body.stepFreeOnly,
    });
    if (route === null) {
      throw new HttpError("no_route", 422, "No route is available between those points.");
    }
    const gemini = getGeminiService();
    const narration = await gemini.narrateRoute(route, body.language);
    return jsonResponse({ route, narration, mocked: gemini.mocked });
  } catch (error) {
    return toErrorResponse(error);
  }
}
