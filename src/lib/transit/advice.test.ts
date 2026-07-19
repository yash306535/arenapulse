import { describe, expect, it } from "vitest";

import { computeLeaveBy } from "./advice";

describe("computeLeaveBy", () => {
  it("subtracts the buffer and journey from kickoff, preserving the offset", () => {
    const advice = computeLeaveBy("2026-06-11T19:00:00-06:00", 45);
    expect(advice.arriveByIso).toBe("2026-06-11T17:30:00-06:00");
    expect(advice.leaveByIso).toBe("2026-06-11T16:45:00-06:00");
  });

  it("supports Zulu timestamps and custom buffers", () => {
    const advice = computeLeaveBy("2026-07-04T18:00:00Z", 30, 60);
    expect(advice.arriveByIso).toBe("2026-07-04T17:00:00Z");
    expect(advice.leaveByIso).toBe("2026-07-04T16:30:00Z");
  });

  it("crosses midnight correctly", () => {
    const advice = computeLeaveBy("2026-06-12T00:30:00-06:00", 90);
    expect(advice.leaveByIso).toBe("2026-06-11T21:30:00-06:00");
  });

  it("rejects invalid input", () => {
    expect(() => computeLeaveBy("not a date", 30)).toThrow(RangeError);
    expect(() => computeLeaveBy("2026-06-11T19:00:00", 30)).toThrow(RangeError);
    expect(() => computeLeaveBy("2026-06-11T19:00:00Z", -5)).toThrow(RangeError);
  });
});
