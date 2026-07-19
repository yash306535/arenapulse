import { describe, expect, it } from "vitest";

import { normalizeSearchResponse } from "./search";
import { createMockSearchService } from "./search.mock";

describe("normalizeSearchResponse", () => {
  it("maps Custom Search items to cited results", () => {
    const normalized = normalizeSearchResponse(
      {
        items: [
          {
            title: "World Cup schedule",
            snippet: "All fixtures listed.",
            link: "https://news.example.com/wc26",
            displayLink: "news.example.com",
          },
          {
            title: "No snippet item",
            link: "https://other.example.com/a",
          },
        ],
      },
      "schedule",
    );
    expect(normalized.results).toHaveLength(2);
    expect(normalized.results[0]?.source).toBe("news.example.com");
    expect(normalized.results[1]?.snippet).toBe("");
    expect(normalized.results[1]?.source).toBe("other.example.com");
    expect(normalized.mocked).toBe(false);
    expect(Date.parse(normalized.retrievedAtIso)).not.toBeNaN();
  });

  it("handles empty result sets and rejects malformed payloads", () => {
    expect(normalizeSearchResponse({}, "obscure query").results).toEqual([]);
    expect(() => normalizeSearchResponse({ items: [{ title: 1 }] }, "q")).toThrow();
  });
});

describe("createMockSearchService", () => {
  const service = createMockSearchService();

  it("returns schedule results for schedule-like queries", async () => {
    const response = await service.search("when is the next match");
    expect(response.mocked).toBe(true);
    expect(response.results[0]?.title).toContain("schedule");
  });

  it("returns weather and transit results by keyword", async () => {
    const weather = await service.search("weather forecast");
    const transit = await service.search("metro strike today");
    expect(weather.results[0]?.url).toContain("weather");
    expect(transit.results[0]?.url).toContain("transit");
  });

  it("falls back to the fan guide for everything else", async () => {
    const response = await service.search("mascot name");
    expect(response.results.length).toBeGreaterThanOrEqual(1);
    expect(response.results[0]?.title).toContain("fan guide");
  });
});
