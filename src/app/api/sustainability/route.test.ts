import { describe, expect, it } from "vitest";

import { POST } from "./route";

import type { ModeComparison } from "@/lib/sustainability/carbon";
import { jsonRequest } from "@/test/http";

const URL = "https://example.test/api/sustainability";

interface SustainabilityResponse {
  comparison: ModeComparison[];
  tip: string;
  note: string;
  mocked: boolean;
}

describe("POST /api/sustainability", () => {
  it("returns a sorted carbon comparison, disclosure note, and a tip", async () => {
    const response = await POST(jsonRequest(URL, { mode: "car", distanceKm: 12 }));
    expect(response.status).toBe(200);
    const body = (await response.json()) as SustainabilityResponse;
    expect(body.mocked).toBe(true);
    expect(body.note.length).toBeGreaterThan(0);
    expect(body.tip.length).toBeGreaterThan(0);
    const emissions = body.comparison.map((entry) => entry.gramsCo2e);
    expect(emissions).toEqual([...emissions].sort((a, b) => a - b));
  });

  it("rejects a non-positive distance with a 400", async () => {
    const response = await POST(jsonRequest(URL, { mode: "metro", distanceKm: 0 }));
    expect(response.status).toBe(400);
  });

  it("rejects an unknown travel mode with a 400", async () => {
    const response = await POST(jsonRequest(URL, { mode: "rocket", distanceKm: 5 }));
    expect(response.status).toBe(400);
  });
});
