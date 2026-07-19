/**
 * Google Programmable Search service layer (server-only) powering Grounded
 * Live Info (F8). Results are returned with title, snippet, and source link
 * for citation, cached for 5 minutes, and treated as untrusted content when
 * passed to the model. Falls back to the mock twin when keys are absent or a
 * live call fails.
 */
import "server-only";

import { z } from "zod";

import { createMockSearchService } from "./search.mock";

import { TtlCache } from "@/lib/cache";
import {
  OUTBOUND_REQUEST_TIMEOUT_MS,
  SEARCH_CACHE_TTL_MS,
  SEARCH_RESULT_COUNT,
} from "@/lib/constants";
import { env, isServiceMocked } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { SearchResponse } from "@/schemas/search";

/** The web-search capability surface consumed by API routes. */
export interface SearchService {
  readonly mocked: boolean;
  search(query: string): Promise<SearchResponse>;
}

/** Minimal schema for the Custom Search JSON API fields we consume. */
const customSearchResponseSchema = z.object({
  items: z
    .array(
      z.object({
        title: z.string(),
        snippet: z.string().optional(),
        link: z.url(),
        displayLink: z.string().optional(),
      }),
    )
    .optional(),
});

/**
 * Normalizes a Custom Search API payload into our cited-result shape.
 * Exported for unit testing against fixture payloads.
 */
export function normalizeSearchResponse(payload: unknown, query: string): SearchResponse {
  const parsed = customSearchResponseSchema.parse(payload);
  return {
    query,
    retrievedAtIso: new Date().toISOString(),
    results: (parsed.items ?? []).map((item) => ({
      title: item.title,
      snippet: item.snippet ?? "",
      url: item.link,
      source: item.displayLink ?? new URL(item.link).hostname,
    })),
    mocked: false,
  };
}

/**
 * Creates the live Programmable Search-backed service. Exported for unit
 * testing with an injected `fetch`; production uses {@link getSearchService}.
 */
export function createRealSearchService(apiKey: string, cx: string): SearchService {
  const fallback = createMockSearchService();
  const cache = new TtlCache<SearchResponse>(SEARCH_CACHE_TTL_MS);

  return {
    mocked: false,
    async search(query: string): Promise<SearchResponse> {
      const cacheKey = query.trim().toLowerCase();
      const cached = cache.get(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
      try {
        const url = new URL("https://www.googleapis.com/customsearch/v1");
        url.searchParams.set("key", apiKey);
        url.searchParams.set("cx", cx);
        url.searchParams.set("q", query);
        url.searchParams.set("num", String(SEARCH_RESULT_COUNT));
        url.searchParams.set("safe", "active");
        const response = await fetch(url, {
          signal: AbortSignal.timeout(OUTBOUND_REQUEST_TIMEOUT_MS),
        });
        if (!response.ok) {
          throw new Error(`Custom Search API HTTP ${String(response.status)}`);
        }
        const normalized = normalizeSearchResponse(await response.json(), query);
        cache.set(cacheKey, normalized);
        return normalized;
      } catch (error) {
        logger.error("Search API call failed; serving mock results", {
          reason: error instanceof Error ? error.message : "unknown",
        });
        return fallback.search(query);
      }
    },
  };
}

let cachedService: SearchService | undefined;

/** Returns the process-wide search service: live when keys exist, mock otherwise. */
export function getSearchService(): SearchService {
  cachedService ??=
    isServiceMocked(env, "search") || env.searchApiKey === undefined || env.searchCx === undefined
      ? createMockSearchService()
      : createRealSearchService(env.searchApiKey, env.searchCx);
  return cachedService;
}
