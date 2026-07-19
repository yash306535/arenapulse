/**
 * F3 — Crowd Intelligence snapshot. GET returns the current simulated per-zone
 * density feed (clearly labeled `simulated: true`). Deterministic and cheap,
 * so it uses the standard rate limiter and is polled by the client.
 */
import { getCrowdSnapshot } from "@/lib/crowd/simulator";
import { enforceRateLimit, jsonResponse, toErrorResponse } from "@/lib/http/api";
import { standardRateLimiter } from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns the latest simulated crowd-density snapshot. */
export function GET(request: Request): Response {
  try {
    enforceRateLimit(request, standardRateLimiter);
    return jsonResponse(getCrowdSnapshot());
  } catch (error) {
    return toErrorResponse(error);
  }
}
