import { describe, expect, it } from "vitest";

import { createMockGeminiService } from "./gemini.mock";

import { getCrowdSnapshot } from "@/lib/crowd/simulator";
import { findRoute } from "@/lib/navigation/pathfinder";
import { listIncidents } from "@/lib/ops/incidents";
import { getStadiumGraph } from "@/lib/stadium";
import { compareTravelModes } from "@/lib/sustainability/carbon";
import { crowdRecommendationSchema } from "@/schemas/crowd";
import { briefingSchema } from "@/schemas/ops";

const service = createMockGeminiService();

async function collect(stream: AsyncGenerator<string>): Promise<string> {
  let text = "";
  for await (const chunk of stream) {
    text += chunk;
  }
  return text;
}

describe("mock streamChat", () => {
  it("answers gate questions from the knowledge base", async () => {
    const text = await collect(
      service.streamChat({ message: "When do the gates open?", history: [] }),
    );
    expect(text).toContain("Gates open 3 hours before kickoff");
  });

  it("greets in the requested language", async () => {
    const text = await collect(
      service.streamChat({ message: "¿Dónde está la comida?", history: [], language: "es" }),
    );
    expect(text).toContain("Esto es lo que encontré");
  });

  it("admits when the knowledge base has no answer", async () => {
    const text = await collect(service.streamChat({ message: "zzz qqq xyzzy", history: [] }));
    expect(text).toContain("could not find that in the stadium guide");
  });

  it("is deterministic", async () => {
    const first = await collect(service.streamChat({ message: "prohibited items", history: [] }));
    const second = await collect(service.streamChat({ message: "prohibited items", history: [] }));
    expect(first).toBe(second);
  });
});

describe("mock structured outputs", () => {
  const snapshot = getCrowdSnapshot(1_750_000_000_000, 42);

  it("recommendCrowdActions satisfies the recommendation schema", async () => {
    const recommendation = await service.recommendCrowdActions(snapshot);
    expect(() => crowdRecommendationSchema.parse(recommendation)).not.toThrow();
    for (const alert of recommendation.alerts) {
      expect(snapshot.zones.some((zone) => zone.zoneId === alert.zoneId)).toBe(true);
    }
  });

  it("generateBriefing satisfies the briefing schema and mentions simulation", async () => {
    const briefing = await service.generateBriefing(listIncidents(), snapshot);
    expect(() => briefingSchema.parse(briefing)).not.toThrow();
    expect(briefing.overview).toContain("simulated");
  });
});

describe("mock text outputs", () => {
  it("narrateRoute includes the computed steps", async () => {
    const route = findRoute(getStadiumGraph(), {
      originId: "gate-b",
      destinationId: "prayer-room",
      stepFreeOnly: true,
    });
    expect(route).not.toBeNull();
    if (route === null) {
      return;
    }
    const narration = await service.narrateRoute(route, "en");
    expect(narration).toContain("Multi-Faith Prayer Room");
    expect(narration).toContain("Total distance");
  });

  it("simplifyText replaces complex words", async () => {
    const simplified = await service.simplifyText({
      text: "Re-entry is prohibited. Please proceed to purchase refreshments.",
      readingLevel: "simple",
      language: "en",
    });
    expect(simplified).toContain("not allowed");
    expect(simplified).toContain("go");
    expect(simplified).toContain("buy");
    expect(simplified).not.toContain("prohibited");
  });

  it("sustainabilityTip names a better option and the saving", async () => {
    const comparison = compareTravelModes(10);
    const tip = await service.sustainabilityTip(comparison, "car");
    expect(tip).toMatch(/save about \d+ g/);
  });

  it("transitAdvice states the leave-by time and duration", async () => {
    const plan = {
      origin: "Downtown",
      destination: "ArenaPulse Demo Stadium",
      mode: "transit" as const,
      steps: [{ instruction: "Ride the metro", durationMinutes: 30, distanceKm: 10 }],
      totalDurationMinutes: 30,
      totalDistanceKm: 10,
      mocked: true,
    };
    const advice = await service.transitAdvice(
      plan,
      "2026-06-11T19:00:00-06:00",
      "2026-06-11T17:00:00-06:00",
    );
    expect(advice).toContain("17:00");
    expect(advice).toContain("30 minutes");
  });
});
