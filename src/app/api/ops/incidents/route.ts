/**
 * F7 — Ops Command Center incident log (operational intelligence). GET lists
 * the in-memory incidents (newest first); POST validates and appends a new
 * staff/volunteer report. Standard rate limit — no upstream AI calls here.
 */
import { enforceRateLimit, jsonResponse, readJsonBody, toErrorResponse } from "@/lib/http/api";
import { addIncident, listIncidents } from "@/lib/ops/incidents";
import { standardRateLimiter } from "@/lib/security/rate-limit";
import { incidentCreateSchema } from "@/schemas/ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns all logged incidents, newest first. */
export function GET(request: Request): Response {
  try {
    enforceRateLimit(request, standardRateLimiter);
    return jsonResponse({ incidents: listIncidents() });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/** Appends a validated incident report and returns the stored record. */
export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, standardRateLimiter);
    const body = await readJsonBody(request, incidentCreateSchema);
    return jsonResponse(addIncident(body), 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
