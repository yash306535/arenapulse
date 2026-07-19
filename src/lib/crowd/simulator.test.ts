import { describe, expect, it } from "vitest";

import { getCrowdSnapshot } from "./simulator";

import { crowdSnapshotSchema } from "@/schemas/crowd";

const FIXED_TS = Date.UTC(2026, 5, 11, 19, 30, 0);

describe("getCrowdSnapshot", () => {
  it("is deterministic for the same timestamp and seed", () => {
    const a = getCrowdSnapshot(FIXED_TS, 42);
    const b = getCrowdSnapshot(FIXED_TS, 42);
    expect(a).toEqual(b);
  });

  it("changes over time and with different seeds", () => {
    const base = getCrowdSnapshot(FIXED_TS, 42);
    const later = getCrowdSnapshot(FIXED_TS + 60 * 60 * 1000, 42);
    const otherSeed = getCrowdSnapshot(FIXED_TS, 7);
    expect(base).not.toEqual(later);
    expect(base).not.toEqual(otherSeed);
  });

  it("is stable within one poll bucket", () => {
    const a = getCrowdSnapshot(FIXED_TS, 42);
    const b = getCrowdSnapshot(FIXED_TS + 1, 42);
    expect(a.zones).toEqual(b.zones);
  });

  it("produces a payload that satisfies the snapshot schema and is labeled simulated", () => {
    const snapshot = getCrowdSnapshot(FIXED_TS);
    const parsed = crowdSnapshotSchema.parse(snapshot);
    expect(parsed.simulated).toBe(true);
    expect(parsed.zones.length).toBeGreaterThanOrEqual(10);
  });

  it("keeps utilization within [0, 1] and occupancy within capacity across a match window", () => {
    for (let minutes = 0; minutes < 180; minutes += 7) {
      const snapshot = getCrowdSnapshot(FIXED_TS + minutes * 60_000, 42);
      for (const zone of snapshot.zones) {
        expect(zone.utilization).toBeGreaterThanOrEqual(0);
        expect(zone.utilization).toBeLessThanOrEqual(1);
        expect(zone.occupancy).toBeLessThanOrEqual(zone.capacity);
        expect(zone.occupancy).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("maps utilization onto the documented density levels", () => {
    const snapshot = getCrowdSnapshot(FIXED_TS, 42);
    for (const zone of snapshot.zones) {
      if (zone.utilization <= 0.4) {
        expect(zone.level).toBe("low");
      } else if (zone.utilization <= 0.65) {
        expect(zone.level).toBe("moderate");
      } else if (zone.utilization <= 0.85) {
        expect(zone.level).toBe("high");
      } else {
        expect(zone.level).toBe("critical");
      }
    }
  });

  it("reports all three trends somewhere across a long window", () => {
    const seen = new Set<string>();
    for (let minutes = 0; minutes < 240; minutes += 1) {
      const snapshot = getCrowdSnapshot(FIXED_TS + minutes * 60_000, 42);
      for (const zone of snapshot.zones) {
        seen.add(zone.trend);
      }
    }
    expect(seen).toEqual(new Set(["rising", "falling", "steady"]));
  });
});
