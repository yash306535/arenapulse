import { afterEach, describe, expect, it } from "vitest";

import { addIncident, listIncidents, resetIncidentsForTest } from "./incidents";

afterEach(() => {
  resetIncidentsForTest();
});

describe("listIncidents", () => {
  it("returns the seed incidents newest first", () => {
    const incidents = listIncidents();
    expect(incidents.length).toBe(6);
    const times = incidents.map((incident) => Date.parse(incident.createdAtIso));
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it("returns a defensive copy", () => {
    const incidents = listIncidents();
    incidents.pop();
    expect(listIncidents().length).toBe(6);
  });
});

describe("addIncident", () => {
  const report = {
    zoneId: "zone-conc-w",
    category: "facilities" as const,
    severity: "low" as const,
    description: "Water fountain leaking near the west elevator.",
    reportedBy: "volunteer" as const,
  };

  it("stores a new open incident with a unique sequential id", () => {
    const created = addIncident(report, new Date("2026-07-05T19:00:00Z"));
    expect(created.id).toBe("inc-007");
    expect(created.status).toBe("open");
    expect(created.createdAtIso).toBe("2026-07-05T19:00:00.000Z");
    expect(listIncidents()[0]).toEqual(created);
  });

  it("keeps ids unique across multiple additions", () => {
    const first = addIncident(report);
    const second = addIncident(report);
    expect(first.id).not.toBe(second.id);
    expect(listIncidents().length).toBe(8);
  });

  it("caps the stored incident count", () => {
    for (let index = 0; index < 250; index += 1) {
      addIncident(report);
    }
    expect(listIncidents().length).toBeLessThanOrEqual(200);
  });
});
