import { describe, expect, it } from "vitest";

import { POST } from "./route";

import { AI_RATE_LIMIT_MAX_REQUESTS } from "@/lib/constants";
import { crowdRecommendationSchema, crowdSnapshotSchema } from "@/schemas/crowd";
import type { CrowdRecommendation, CrowdSnapshot } from "@/schemas/crowd";
import { jsonRequest } from "@/test/http";

const URL = "https://example.test/api/crowd/recommend";

interface RecommendResponse {
  snapshot: CrowdSnapshot;
  recommendation: CrowdRecommendation;
  mocked: boolean;
}

describe("POST /api/crowd/recommend", () => {
  it("returns the server-computed snapshot and validated recommendations", async () => {
    const response = await POST(jsonRequest(URL, {}));
    expect(response.status).toBe(200);
    const body = (await response.json()) as RecommendResponse;
    expect(body.mocked).toBe(true);
    expect(() => crowdSnapshotSchema.parse(body.snapshot)).not.toThrow();
    expect(() => crowdRecommendationSchema.parse(body.recommendation)).not.toThrow();
  });

  it("enforces the AI rate limit with a 429", async () => {
    const ip = "198.51.100.210";
    let last = await POST(jsonRequest(URL, {}, ip));
    for (let index = 0; index < AI_RATE_LIMIT_MAX_REQUESTS + 1; index += 1) {
      last = await POST(jsonRequest(URL, {}, ip));
    }
    expect(last.status).toBe(429);
  });
});
