import { describe, expect, it } from "vitest";

import { POST } from "./route";

import { briefingSchema } from "@/schemas/ops";
import type { Briefing } from "@/schemas/ops";
import { jsonRequest } from "@/test/http";

const URL = "https://example.test/api/ops/briefing";

interface BriefingResponse {
  briefing: Briefing;
  mocked: boolean;
}

describe("POST /api/ops/briefing", () => {
  it("returns a structured, schema-valid shift briefing", async () => {
    const response = await POST(jsonRequest(URL, {}));
    expect(response.status).toBe(200);
    const body = (await response.json()) as BriefingResponse;
    expect(body.mocked).toBe(true);
    expect(() => briefingSchema.parse(body.briefing)).not.toThrow();
    expect(body.briefing.keyPoints.length).toBeGreaterThan(0);
  });
});
