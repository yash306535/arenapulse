import { describe, expect, it } from "vitest";

import { normalizeDirectionsResponse, stripHtml } from "./maps";
import { createMockMapsService } from "./maps.mock";

describe("stripHtml", () => {
  it("removes tags and entities from Google step instructions", () => {
    expect(stripHtml("Turn <b>left</b> onto&nbsp;Main St &amp; continue")).toBe(
      "Turn left onto Main St & continue",
    );
  });
});

describe("normalizeDirectionsResponse", () => {
  const payload = {
    status: "OK",
    routes: [
      {
        legs: [
          {
            duration: { value: 1860 },
            distance: { value: 9400 },
            steps: [
              {
                html_instructions: "Walk to <b>Central Station</b>",
                duration: { value: 480 },
                distance: { value: 600 },
              },
              {
                html_instructions: "Take the <b>metro</b> toward the stadium",
                duration: { value: 1200 },
                distance: { value: 8400 },
              },
            ],
          },
        ],
      },
    ],
  };

  it("maps a Directions payload to a TransitPlan", () => {
    const plan = normalizeDirectionsResponse(payload, "Centro", "transit");
    expect(plan.origin).toBe("Centro");
    expect(plan.destination).toBe("ArenaPulse Demo Stadium");
    expect(plan.totalDurationMinutes).toBe(31);
    expect(plan.totalDistanceKm).toBe(9.4);
    expect(plan.steps[0]?.instruction).toBe("Walk to Central Station");
    expect(plan.mocked).toBe(false);
  });

  it("throws on non-OK status or empty routes", () => {
    expect(() =>
      normalizeDirectionsResponse({ status: "ZERO_RESULTS", routes: [] }, "Centro", "transit"),
    ).toThrow(/ZERO_RESULTS/);
    expect(() => normalizeDirectionsResponse({ nonsense: true }, "Centro", "walk")).toThrow();
  });
});

describe("createMockMapsService", () => {
  const service = createMockMapsService();

  it("produces deterministic plans per origin and mode", async () => {
    const first = await service.planJourney("Centro Historico", "transit");
    const second = await service.planJourney("Centro Historico", "transit");
    expect(first).toEqual(second);
    expect(first.mocked).toBe(true);
    expect(first.totalDurationMinutes).toBeGreaterThan(0);
    expect(first.steps.length).toBe(3);
  });

  it("varies plans across origins and modes", async () => {
    const transit = await service.planJourney("Centro Historico", "transit");
    const walk = await service.planJourney("Centro Historico", "walk");
    const otherOrigin = await service.planJourney("Airport", "transit");
    expect(walk.steps).toHaveLength(1);
    expect(transit.totalDurationMinutes).not.toBe(walk.totalDurationMinutes);
    expect(otherOrigin.totalDistanceKm).not.toBe(transit.totalDistanceKm);
  });

  it("keeps step durations consistent with the total", async () => {
    const plan = await service.planJourney("Zapopan", "drive");
    const sum = plan.steps.reduce((total, step) => total + step.durationMinutes, 0);
    expect(plan.totalDurationMinutes).toBe(sum);
  });

  it("serves an accessible SVG demo map", async () => {
    const image = await service.staticMapImage({ width: 600, height: 400, zoom: 15 });
    expect(image.contentType).toBe("image/svg+xml");
    expect(typeof image.body).toBe("string");
    expect(image.body).toContain("Demo mode map");
    expect(image.body).toContain('role="img"');
  });
});
