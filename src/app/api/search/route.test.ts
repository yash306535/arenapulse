import { describe, expect, it } from "vitest";

import { GET } from "./route";

import type { SearchResponse } from "@/schemas/search";
import { searchResponseSchema } from "@/schemas/search";
import { getRequest } from "@/test/http";

const BASE = "https://example.test/api/search";

describe("GET /api/search", () => {
  it("returns cited, schema-valid mock results with a timestamp", async () => {
    const response = await GET(getRequest(`${BASE}?q=match schedule`));
    expect(response.status).toBe(200);
    const body = (await response.json()) as SearchResponse;
    expect(() => searchResponseSchema.parse(body)).not.toThrow();
    expect(body.mocked).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.results[0]?.url).toMatch(/^https:\/\//);
    expect(() => new Date(body.retrievedAtIso)).not.toThrow();
  });

  it("rejects a missing query with a 400", async () => {
    const response = await GET(getRequest(BASE));
    expect(response.status).toBe(400);
  });

  it("rejects a too-short query with a 400", async () => {
    const response = await GET(getRequest(`${BASE}?q=a`));
    expect(response.status).toBe(400);
  });

  it("rejects unknown query parameters with a 400", async () => {
    const response = await GET(getRequest(`${BASE}?q=weather&inject=1`));
    expect(response.status).toBe(400);
  });
});
