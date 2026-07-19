import { afterEach, describe, expect, it, vi } from "vitest";

import { createRealMapsService, normalizeDirectionsResponse, stripHtml } from "./maps";
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

describe("createRealMapsService (live path with injected fetch)", () => {
  const directionsPayload = {
    status: "OK",
    routes: [
      {
        legs: [
          {
            duration: { value: 1200 },
            distance: { value: 8000 },
            steps: [
              {
                html_instructions: "Head to the <b>station</b>",
                duration: { value: 600 },
                distance: { value: 4000 },
              },
            ],
          },
        ],
      },
    ],
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("plans a journey from a live Directions response and caches it", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(Response.json(directionsPayload, { status: 200 })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const service = createRealMapsService("test-key");

    const plan = await service.planJourney("Centro", "transit");
    expect(plan.mocked).toBe(false);
    expect(plan.totalDurationMinutes).toBe(20);

    await service.planJourney("Centro", "transit");
    expect(fetchMock).toHaveBeenCalledTimes(1); // second call served from cache
  });

  it("falls back to the mock plan on an HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("nope", { status: 500 }))),
    );
    const service = createRealMapsService("test-key");
    const plan = await service.planJourney("Airport", "drive");
    expect(plan.mocked).toBe(true);
  });

  it("returns live static map bytes with the upstream content type", async () => {
    const bytes = new Uint8Array([137, 80, 78, 71]);
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(
          new Response(bytes, { status: 200, headers: { "content-type": "image/png" } }),
        ),
      ),
    );
    const service = createRealMapsService("test-key");
    const image = await service.staticMapImage({ width: 600, height: 400, zoom: 15 });
    expect(image.contentType).toBe("image/png");
    expect(image.body).toBeInstanceOf(ArrayBuffer);
  });

  it("falls back to the mock map when the static map call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("network down"))),
    );
    const service = createRealMapsService("test-key");
    const image = await service.staticMapImage({ width: 600, height: 400, zoom: 15 });
    expect(image.contentType).toBe("image/svg+xml");
  });
});
