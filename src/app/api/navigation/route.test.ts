import { describe, expect, it } from "vitest";

import { POST } from "./route";

import { routeResultSchema } from "@/schemas/navigation";
import type { RouteResult } from "@/schemas/navigation";
import { jsonRequest } from "@/test/http";

const URL = "https://example.test/api/navigation";

interface NavigationResponse {
  route: RouteResult;
  narration: string;
  mocked: boolean;
}

describe("POST /api/navigation", () => {
  it("computes and narrates a route between two nodes", async () => {
    const response = await POST(
      jsonRequest(URL, { originId: "gate-a", destinationId: "sec-e1", language: "en" }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as NavigationResponse;
    expect(() => routeResultSchema.parse(body.route)).not.toThrow();
    expect(body.route.nodeIds[0]).toBe("gate-a");
    expect(body.route.nodeIds.at(-1)).toBe("sec-e1");
    expect(body.narration.length).toBeGreaterThan(0);
  });

  it("returns a fully step-free route when requested (F4 accessibility)", async () => {
    const response = await POST(
      jsonRequest(URL, { originId: "gate-a", destinationId: "sec-n1", stepFreeOnly: true }),
    );
    const body = (await response.json()) as NavigationResponse;
    expect(body.route.stepFree).toBe(true);
    expect(body.route.steps.every((step) => step.stepFree)).toBe(true);
  });

  it("returns 422 when no route exists under the constraints", async () => {
    const response = await POST(
      jsonRequest(URL, { originId: "gate-a", destinationId: "does-not-exist" }),
    );
    expect(response.status).toBe(422);
  });

  it("rejects a missing destination with a 400", async () => {
    const response = await POST(jsonRequest(URL, { originId: "gate-a" }));
    expect(response.status).toBe(400);
  });
});
