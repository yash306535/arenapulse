/**
 * Google Maps service layer (server-only). Wraps the Directions API for
 * journey planning and the Static Maps API for the proxied map image — the
 * API key never leaves the server; the browser only ever talks to our own
 * /api/map-image route. Falls back to the deterministic mock twin when no key
 * is configured or a live call fails. Plans are cached for 2 minutes.
 */
import "server-only";

import { z } from "zod";

import { createMockMapsService } from "./maps.mock";

import { TtlCache } from "@/lib/cache";
import {
  OUTBOUND_REQUEST_TIMEOUT_MS,
  STADIUM_LAT,
  STADIUM_LNG,
  TRANSIT_CACHE_TTL_MS,
} from "@/lib/constants";
import { env, isServiceMocked } from "@/lib/env";
import { logger } from "@/lib/logger";
import { venueName } from "@/lib/schedule";
import type { TransitPlan, TravelMode } from "@/schemas/transit";

/** A static map image payload served through /api/map-image. */
export interface StaticMapImage {
  readonly contentType: string;
  readonly body: string | ArrayBuffer;
}

/** Options for the proxied static map. */
export interface StaticMapOptions {
  readonly width: number;
  readonly height: number;
  readonly zoom: number;
}

/** The mapping capability surface consumed by API routes. */
export interface MapsService {
  readonly mocked: boolean;
  planJourney(origin: string, mode: TravelMode): Promise<TransitPlan>;
  staticMapImage(options: StaticMapOptions): Promise<StaticMapImage>;
}

const GOOGLE_MODE: Record<TravelMode, string> = {
  transit: "transit",
  drive: "driving",
  walk: "walking",
};

/** Minimal schema for the Directions API fields we consume. */
const directionsResponseSchema = z.object({
  status: z.string(),
  routes: z.array(
    z.object({
      legs: z.array(
        z.object({
          duration: z.object({ value: z.number() }),
          distance: z.object({ value: z.number() }),
          steps: z.array(
            z.object({
              html_instructions: z.string().optional(),
              duration: z.object({ value: z.number() }),
              distance: z.object({ value: z.number() }),
            }),
          ),
        }),
      ),
    }),
  ),
});

/** Strips HTML tags and entities Google embeds in step instructions. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalizes a Directions API JSON payload into a TransitPlan.
 * Exported for unit testing against fixture payloads; throws on
 * malformed or empty responses.
 */
export function normalizeDirectionsResponse(
  payload: unknown,
  origin: string,
  mode: TravelMode,
): TransitPlan {
  const parsed = directionsResponseSchema.parse(payload);
  const leg = parsed.routes[0]?.legs[0];
  if (parsed.status !== "OK" || leg === undefined) {
    throw new Error(`Directions API returned status ${parsed.status}`);
  }
  const steps = leg.steps.map((step) => ({
    instruction: stripHtml(step.html_instructions ?? "Continue"),
    durationMinutes: Math.round(step.duration.value / 60),
    distanceKm: Number((step.distance.value / 1000).toFixed(1)),
  }));
  return {
    origin,
    destination: venueName(),
    mode,
    steps:
      steps.length > 0 ? steps : [{ instruction: "Continue", durationMinutes: 0, distanceKm: 0 }],
    totalDurationMinutes: Math.max(1, Math.round(leg.duration.value / 60)),
    totalDistanceKm: Math.max(0.1, Number((leg.distance.value / 1000).toFixed(1))),
    mocked: false,
  };
}

/**
 * Creates the live Google Maps-backed service. Exported for unit testing with
 * an injected `fetch`; production code obtains it via {@link getMapsService}.
 */
export function createRealMapsService(apiKey: string): MapsService {
  const fallback = createMockMapsService();
  const planCache = new TtlCache<TransitPlan>(TRANSIT_CACHE_TTL_MS);

  return {
    mocked: false,

    async planJourney(origin: string, mode: TravelMode): Promise<TransitPlan> {
      const cacheKey = `${mode}|${origin.toLowerCase()}`;
      const cached = planCache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
        url.searchParams.set("origin", origin);
        url.searchParams.set("destination", `${String(STADIUM_LAT)},${String(STADIUM_LNG)}`);
        url.searchParams.set("mode", GOOGLE_MODE[mode]);
        url.searchParams.set("key", apiKey);
        const response = await fetch(url, {
          signal: AbortSignal.timeout(OUTBOUND_REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
          throw new Error(`Directions API HTTP ${String(response.status)}`);
        }
        const plan = normalizeDirectionsResponse(await response.json(), origin, mode);
        planCache.set(cacheKey, plan);
        return plan;
      } catch (error) {
        logger.error("Directions API call failed; serving mock plan", {
          reason: error instanceof Error ? error.message : "unknown",
        });
        return fallback.planJourney(origin, mode);
      }
    },

    async staticMapImage(options: StaticMapOptions): Promise<StaticMapImage> {
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/staticmap");
        url.searchParams.set("center", `${String(STADIUM_LAT)},${String(STADIUM_LNG)}`);
        url.searchParams.set("zoom", String(options.zoom));
        url.searchParams.set("size", `${String(options.width)}x${String(options.height)}`);
        url.searchParams.set(
          "markers",
          `color:green|${String(STADIUM_LAT)},${String(STADIUM_LNG)}`,
        );
        url.searchParams.set("key", apiKey);
        const response = await fetch(url, {
          signal: AbortSignal.timeout(OUTBOUND_REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
          throw new Error(`Static Maps API HTTP ${String(response.status)}`);
        }
        return {
          contentType: response.headers.get("content-type") ?? "image/png",
          body: await response.arrayBuffer(),
        };
      } catch (error) {
        logger.error("Static Maps API call failed; serving mock map", {
          reason: error instanceof Error ? error.message : "unknown",
        });
        return fallback.staticMapImage(options);
      }
    },
  };
}

let cachedService: MapsService | undefined;

/** Returns the process-wide Maps service: live when a key exists, mock otherwise. */
export function getMapsService(): MapsService {
  cachedService ??=
    isServiceMocked(env, "maps") || env.mapsApiKey === undefined
      ? createMockMapsService()
      : createRealMapsService(env.mapsApiKey);
  return cachedService;
}
