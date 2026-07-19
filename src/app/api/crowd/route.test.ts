import { describe, expect, it } from "vitest";

import { GET } from "./route";

import { AI_RATE_LIMIT_MAX_REQUESTS, STANDARD_RATE_LIMIT_MAX_REQUESTS } from "@/lib/constants";
import type { CrowdSnapshot } from "@/schemas/crowd";
import { crowdSnapshotSchema } from "@/schemas/crowd";
import { getRequest } from "@/test/http";

const URL = "https://example.test/api/crowd";

describe("GET /api/crowd", () => {
  it("returns a schema-valid, simulated snapshot", async () => {
    const response = GET(getRequest(URL));
    expect(response.status).toBe(200);
    const body = (await response.json()) as CrowdSnapshot;
    expect(() => crowdSnapshotSchema.parse(body)).not.toThrow();
    expect(body.simulated).toBe(true);
    expect(body.zones.length).toBeGreaterThan(0);
  });

  it("enforces the standard rate limit with a 429 and Retry-After", () => {
    const ip = "198.51.100.200";
    let last = GET(getRequest(URL, ip));
    for (let index = 0; index < STANDARD_RATE_LIMIT_MAX_REQUESTS + 1; index += 1) {
      last = GET(getRequest(URL, ip));
    }
    expect(last.status).toBe(429);
    expect(last.headers.get("retry-after")).toBeTruthy();
  });

  it("allows more than the AI limit since it is a standard route", () => {
    const ip = "198.51.100.201";
    let last = GET(getRequest(URL, ip));
    for (let index = 0; index < AI_RATE_LIMIT_MAX_REQUESTS + 1; index += 1) {
      last = GET(getRequest(URL, ip));
    }
    expect(last.status).toBe(200);
  });
});
