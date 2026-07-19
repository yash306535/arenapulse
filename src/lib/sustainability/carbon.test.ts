import { describe, expect, it } from "vitest";

import { carbonFactorsNote, co2GramsFor, compareTravelModes } from "./carbon";

describe("co2GramsFor", () => {
  it("computes emissions from the fixture factors", () => {
    expect(co2GramsFor("car", 10)).toBe(1700);
    expect(co2GramsFor("metro", 10)).toBe(350);
    expect(co2GramsFor("walk", 10)).toBe(0);
  });

  it("rounds to whole grams", () => {
    expect(co2GramsFor("metro", 1.5)).toBe(53);
  });

  it("rejects non-positive, non-finite, or absurd distances", () => {
    expect(() => co2GramsFor("car", 0)).toThrow(RangeError);
    expect(() => co2GramsFor("car", -3)).toThrow(RangeError);
    expect(() => co2GramsFor("car", Number.NaN)).toThrow(RangeError);
    expect(() => co2GramsFor("car", 501)).toThrow(RangeError);
  });
});

describe("compareTravelModes", () => {
  it("covers every mode, sorted from lowest to highest emissions", () => {
    const comparison = compareTravelModes(12);
    expect(comparison).toHaveLength(6);
    const emissions = comparison.map((entry) => entry.gramsCo2e);
    expect(emissions).toEqual([...emissions].sort((a, b) => a - b));
    expect(comparison[0]?.gramsCo2e).toBe(0);
    expect(comparison.at(-1)?.mode).toBe("car");
  });

  it("reports savings relative to driving alone", () => {
    const comparison = compareTravelModes(10);
    const metro = comparison.find((entry) => entry.mode === "metro");
    expect(metro?.savedVsCarGrams).toBe(1700 - 350);
    const car = comparison.find((entry) => entry.mode === "car");
    expect(car?.savedVsCarGrams).toBe(0);
  });

  it("propagates distance validation", () => {
    expect(() => compareTravelModes(0)).toThrow(RangeError);
  });
});

describe("carbonFactorsNote", () => {
  it("discloses that the factors are illustrative", () => {
    expect(carbonFactorsNote()).toMatch(/[Ii]llustrative/);
  });
});

describe("listCarbonModes", () => {
  it("lists every configured mode with a label", async () => {
    const { listCarbonModes } = await import("./carbon");
    const modes = listCarbonModes();
    expect(modes.length).toBeGreaterThan(0);
    expect(modes.every((entry) => entry.label.length > 0)).toBe(true);
    expect(modes.map((entry) => entry.mode)).toContain("car");
  });
});
