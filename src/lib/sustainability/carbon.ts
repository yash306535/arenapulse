/**
 * Travel-mode carbon calculator for the Sustainability Hub. Pure math over
 * the illustrative emission factors fixture; no I/O, fully unit-tested.
 */
import { z } from "zod";

import carbonFactorsRaw from "@/data/carbon-factors.json";
import { MAX_TRIP_DISTANCE_KM, carbonModeSchema } from "@/schemas/sustainability";
import type { CarbonMode } from "@/schemas/sustainability";

const factorsSchema = z.object({
  note: z.string(),
  factors: z
    .array(
      z.object({
        mode: carbonModeSchema,
        label: z.string().min(1),
        gramsCo2ePerKm: z.number().nonnegative(),
      }),
    )
    .min(1),
});

const carbonData = factorsSchema.parse(carbonFactorsRaw);

/** Emissions comparison for one travel mode over a fixed trip. */
export interface ModeComparison {
  readonly mode: CarbonMode;
  readonly label: string;
  readonly gramsCo2e: number;
  /** Grams avoided relative to driving alone the same distance. */
  readonly savedVsCarGrams: number;
}

/** The disclosure note attached to the emission factors fixture. */
export function carbonFactorsNote(): string {
  return carbonData.note;
}

/** Computes grams of CO2e for one person travelling `distanceKm` by `mode`. */
export function co2GramsFor(mode: CarbonMode, distanceKm: number): number {
  assertDistance(distanceKm);
  const factor = carbonData.factors.find((entry) => entry.mode === mode);
  if (factor === undefined) {
    throw new RangeError(`Unknown travel mode: ${mode}`);
  }
  return Math.round(factor.gramsCo2ePerKm * distanceKm);
}

/** Compares all travel modes for a trip, sorted from lowest to highest emissions. */
export function compareTravelModes(distanceKm: number): ModeComparison[] {
  assertDistance(distanceKm);
  const carGrams = co2GramsFor("car", distanceKm);
  return carbonData.factors
    .map((factor) => {
      const gramsCo2e = Math.round(factor.gramsCo2ePerKm * distanceKm);
      return {
        mode: factor.mode,
        label: factor.label,
        gramsCo2e,
        savedVsCarGrams: carGrams - gramsCo2e,
      };
    })
    .sort((a, b) => a.gramsCo2e - b.gramsCo2e);
}

function assertDistance(distanceKm: number): void {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > MAX_TRIP_DISTANCE_KM) {
    throw new RangeError(`distanceKm must be in (0, ${String(MAX_TRIP_DISTANCE_KM)}]`);
  }
}
