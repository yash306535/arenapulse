/**
 * F5 — Proxied static map image. GET fetches the Static Maps image server-side
 * (or the mock SVG in demo mode) and streams the bytes back, so the Google
 * Maps API key is never exposed to the browser and `img-src 'self'` can stay
 * strict in the CSP. Query size/zoom are bounded by the schema. Standard limit.
 */
import { getMapsService } from "@/lib/google/maps";
import { enforceRateLimit, readQuery, toErrorResponse } from "@/lib/http/api";
import { standardRateLimiter } from "@/lib/security/rate-limit";
import { staticMapQuerySchema } from "@/schemas/map";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns a stadium-area static map image proxied through our own origin. */
export async function GET(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, standardRateLimiter);
    const { width, height, zoom } = readQuery(request, staticMapQuerySchema);
    const image = await getMapsService().staticMapImage({ width, height, zoom });
    return new Response(image.body, {
      headers: {
        "content-type": image.contentType,
        "cache-control": "public, max-age=300",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
