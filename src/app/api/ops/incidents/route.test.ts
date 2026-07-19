import { afterEach, describe, expect, it } from "vitest";

import { GET, POST } from "./route";

import { resetIncidentsForTest } from "@/lib/ops/incidents";
import { incidentSchema } from "@/schemas/ops";
import type { Incident } from "@/schemas/ops";
import { getRequest, jsonRequest } from "@/test/http";

const URL = "https://example.test/api/ops/incidents";

afterEach(() => {
  resetIncidentsForTest();
});

const validReport = {
  zoneId: "zone-conc-w",
  category: "facilities" as const,
  severity: "low" as const,
  description: "Water fountain leaking near the west elevator.",
  reportedBy: "volunteer" as const,
};

describe("GET /api/ops/incidents", () => {
  it("lists seeded incidents newest first", async () => {
    const response = GET(getRequest(URL));
    expect(response.status).toBe(200);
    const body = (await response.json()) as { incidents: Incident[] };
    expect(body.incidents.length).toBeGreaterThan(0);
    const times = body.incidents.map((incident) => Date.parse(incident.createdAtIso));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });
});

describe("POST /api/ops/incidents", () => {
  it("appends a validated incident and returns 201", async () => {
    const response = await POST(jsonRequest(URL, validReport));
    expect(response.status).toBe(201);
    const created = (await response.json()) as Incident;
    expect(() => incidentSchema.parse(created)).not.toThrow();
    expect(created.status).toBe("open");
  });

  it("rejects a too-short description with a 400", async () => {
    const response = await POST(jsonRequest(URL, { ...validReport, description: "no" }));
    expect(response.status).toBe(400);
  });

  it("rejects an invalid category with a 400", async () => {
    const response = await POST(jsonRequest(URL, { ...validReport, category: "aliens" }));
    expect(response.status).toBe(400);
  });
});
