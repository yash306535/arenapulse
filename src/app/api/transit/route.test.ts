import { describe, expect, it } from "vitest";

import { POST } from "./route";

import { transitPlanSchema } from "@/schemas/transit";
import type { TransitPlan } from "@/schemas/transit";
import { jsonRequest } from "@/test/http";

const URL = "https://example.test/api/transit";

interface TransitResponse {
  plan: TransitPlan;
  advice: string;
  kickoffIso: string;
  arriveByIso: string;
  leaveByIso: string;
  mocked: boolean;
}

describe("POST /api/transit", () => {
  it("plans a journey with leave-by advice for a known match", async () => {
    const response = await POST(
      jsonRequest(URL, { matchId: "match-1", origin: "Downtown Guadalajara", mode: "transit" }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as TransitResponse;
    expect(() => transitPlanSchema.parse(body.plan)).not.toThrow();
    expect(body.mocked).toBe(true);
    expect(body.kickoffIso).toBe("2026-06-11T19:00:00-06:00");
    // leave-by precedes arrive-by, which precedes kickoff.
    expect(Date.parse(body.leaveByIso)).toBeLessThan(Date.parse(body.arriveByIso));
    expect(Date.parse(body.arriveByIso)).toBeLessThan(Date.parse(body.kickoffIso));
    expect(body.advice).toContain(":");
  });

  it("returns 404 for an unknown match", async () => {
    const response = await POST(
      jsonRequest(URL, { matchId: "match-999", origin: "Anywhere", mode: "drive" }),
    );
    expect(response.status).toBe(404);
  });

  it("rejects an invalid travel mode with a 400", async () => {
    const response = await POST(
      jsonRequest(URL, { matchId: "match-1", origin: "Downtown", mode: "teleport" }),
    );
    expect(response.status).toBe(400);
  });

  it("rejects a missing origin with a 400", async () => {
    const response = await POST(jsonRequest(URL, { matchId: "match-1", mode: "walk" }));
    expect(response.status).toBe(400);
  });
});
