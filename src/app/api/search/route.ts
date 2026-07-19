/**
 * F8 — Grounded Live Info. GET wraps the Google Programmable Search API
 * (server-side) and returns cited results with source links and a retrieval
 * timestamp. Results are cached upstream for 5 minutes. Standard rate limit.
 */
import { getSearchService } from "@/lib/google/search";
import { enforceRateLimit, jsonResponse, readQuery, toErrorResponse } from "@/lib/http/api";
import { standardRateLimiter } from "@/lib/security/rate-limit";
import { searchRequestSchema } from "@/schemas/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns cited live-search results for the `q` query parameter. */
export async function GET(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, standardRateLimiter);
    const { q } = readQuery(request, searchRequestSchema);
    return jsonResponse(await getSearchService().search(q));
  } catch (error) {
    return toErrorResponse(error);
  }
}
