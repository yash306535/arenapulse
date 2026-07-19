/**
 * Deterministic mock twin of the Google Programmable Search service. Returns
 * clearly-labeled demo results chosen by keyword so Grounded Live Info (F8)
 * stays demonstrable with zero keys. Active when search keys are absent or
 * MOCK_MODE=true.
 */
import type { SearchService } from "./search";

import type { SearchResponse, SearchResult } from "@/schemas/search";

const DEMO_SOURCE = "example.org (demo result)";

const SCHEDULE_RESULTS: SearchResult[] = [
  {
    title: "FIFA World Cup 2026 — match schedule at the demo venue",
    snippet:
      "Upcoming fixtures at ArenaPulse Demo Stadium include group-stage and knockout matches through July 4, 2026. Gates open three hours before kickoff.",
    url: "https://example.org/wc26/schedule",
    source: DEMO_SOURCE,
  },
  {
    title: "Kickoff times and broadcast guide",
    snippet: "Full kickoff times for all June and July fixtures, listed in local venue time.",
    url: "https://example.org/wc26/kickoff-times",
    source: DEMO_SOURCE,
  },
];

const WEATHER_RESULTS: SearchResult[] = [
  {
    title: "Match-day weather outlook",
    snippet:
      "Warm and partly cloudy around the stadium, high of 28°C with a light evening breeze. Hydration stations recommended for afternoon kickoffs.",
    url: "https://example.org/wc26/weather",
    source: DEMO_SOURCE,
  },
];

const TRANSIT_RESULTS: SearchResult[] = [
  {
    title: "Stadium transit updates",
    snippet:
      "Metro running at 3-minute headways on match days; shuttle buses from downtown every 10 minutes. Allow extra time for security screening.",
    url: "https://example.org/wc26/transit-updates",
    source: DEMO_SOURCE,
  },
];

const DEFAULT_RESULTS: SearchResult[] = [
  {
    title: "FIFA World Cup 2026 fan guide",
    snippet:
      "Everything fans need for the tournament: tickets, venues, fan festivals, and travel guidance across the host cities.",
    url: "https://example.org/wc26/fan-guide",
    source: DEMO_SOURCE,
  },
  {
    title: "Stadium services overview",
    snippet:
      "Accessibility services, food courts, water refill stations, and sustainability programs at the venue.",
    url: "https://example.org/wc26/stadium-services",
    source: DEMO_SOURCE,
  },
];

function resultsFor(query: string): SearchResult[] {
  const q = query.toLowerCase();
  if (/schedule|fixture|kick|match|game|when/.test(q)) {
    return SCHEDULE_RESULTS;
  }
  if (/weather|rain|forecast|temperature|heat/.test(q)) {
    return WEATHER_RESULTS;
  }
  if (/transit|metro|bus|train|parking|traffic|strike/.test(q)) {
    return TRANSIT_RESULTS;
  }
  return DEFAULT_RESULTS;
}

/** Creates the deterministic mock search service. */
export function createMockSearchService(): SearchService {
  return {
    mocked: true,
    search(query: string): Promise<SearchResponse> {
      return Promise.resolve({
        query,
        retrievedAtIso: new Date().toISOString(),
        results: resultsFor(query),
        mocked: true,
      });
    },
  };
}
