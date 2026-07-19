/**
 * Schemas for Grounded Live Info (F8): Google Programmable Search requests
 * and the cited-result shape rendered with source links and timestamps.
 */
import { z } from "zod";

import { MAX_QUERY_LENGTH } from "@/lib/constants";

export const searchRequestSchema = z.strictObject({
  q: z.string().trim().min(2).max(MAX_QUERY_LENGTH),
});
export type SearchRequest = z.infer<typeof searchRequestSchema>;

export const searchResultSchema = z.object({
  title: z.string().min(1),
  snippet: z.string(),
  url: z.url(),
  source: z.string().min(1),
});
export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchResponseSchema = z.object({
  query: z.string(),
  retrievedAtIso: z.string(),
  results: z.array(searchResultSchema),
  mocked: z.boolean(),
});
export type SearchResponse = z.infer<typeof searchResponseSchema>;
