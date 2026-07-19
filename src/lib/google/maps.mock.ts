/**
 * Deterministic mock twin of the Google Maps service. Journey plans derive
 * from a stable hash of the origin string, so the same inputs always produce
 * the same plan; the static map is a locally generated SVG. Active when
 * GOOGLE_MAPS_API_KEY is absent or MOCK_MODE=true.
 */
import type { MapsService, StaticMapImage } from "./maps";

import { venueName } from "@/lib/schedule";
import type { TransitPlan, TravelMode } from "@/schemas/transit";

/** Stable non-cryptographic string hash → [0, 1). */
function originFactor(origin: string): number {
  let h = 2166136261;
  for (const char of origin.toLowerCase()) {
    h = Math.imul(h ^ (char.codePointAt(0) ?? 0), 16777619);
  }
  return (h >>> 0) / 0x1_0000_0000;
}

/** Journey distance in km, deterministic in [4, 18). */
function distanceKmFor(origin: string): number {
  return Number((4 + originFactor(origin) * 14).toFixed(1));
}

function buildPlan(origin: string, mode: TravelMode): TransitPlan {
  const distanceKm = distanceKmFor(origin);
  const destination = venueName();
  const round = (value: number): number => Math.round(value);

  let steps: TransitPlan["steps"];
  if (mode === "transit") {
    const rideMinutes = round((distanceKm / 30) * 60);
    steps = [
      {
        instruction: `Walk from ${origin} to the nearest metro station`,
        durationMinutes: 8,
        distanceKm: 0.6,
      },
      {
        instruction: "Ride the stadium line toward the venue",
        durationMinutes: rideMinutes,
        distanceKm: Number((distanceKm - 1.2).toFixed(1)),
      },
      {
        instruction: "Walk from Stadium Station to the Gate A plaza",
        durationMinutes: 9,
        distanceKm: 0.6,
      },
    ];
  } else if (mode === "drive") {
    const driveMinutes = round((distanceKm / 28) * 60) + 6;
    steps = [
      {
        instruction: `Drive from ${origin} via the stadium expressway`,
        durationMinutes: driveMinutes,
        distanceKm,
      },
      { instruction: "Park at Lot P4 (event parking)", durationMinutes: 6, distanceKm: 0.3 },
      { instruction: "Walk from Lot P4 to the gates", durationMinutes: 10, distanceKm: 0.7 },
    ];
  } else {
    steps = [
      {
        instruction: `Walk from ${origin} to the stadium following the fan route signage`,
        durationMinutes: round((distanceKm / 4.5) * 60),
        distanceKm,
      },
    ];
  }

  return {
    origin,
    destination,
    mode,
    steps,
    totalDurationMinutes: steps.reduce((sum, step) => sum + step.durationMinutes, 0),
    totalDistanceKm: Number(steps.reduce((sum, step) => sum + step.distanceKm, 0).toFixed(1)),
    mocked: true,
  };
}

const MOCK_MAP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" role="img" aria-label="Demo map of the stadium area">
  <rect width="600" height="400" fill="#e8f0e8"/>
  <path d="M0 210 H600" stroke="#b8c4d0" stroke-width="22"/>
  <path d="M300 0 V400" stroke="#c9d3dd" stroke-width="14"/>
  <path d="M40 60 Q200 90 300 210" stroke="#9db3c8" stroke-width="8" fill="none"/>
  <ellipse cx="300" cy="210" rx="52" ry="36" fill="#2f6f4f"/>
  <ellipse cx="300" cy="210" rx="30" ry="18" fill="#57a377"/>
  <text x="300" y="270" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#1d3a2c">ArenaPulse Demo Stadium</text>
  <text x="300" y="380" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#5a6672">Demo mode map — no live map service configured</text>
</svg>`;

/** Creates the deterministic mock Maps service. */
export function createMockMapsService(): MapsService {
  return {
    mocked: true,
    planJourney(origin: string, mode: TravelMode): Promise<TransitPlan> {
      return Promise.resolve(buildPlan(origin, mode));
    },
    staticMapImage(): Promise<StaticMapImage> {
      return Promise.resolve({ contentType: "image/svg+xml", body: MOCK_MAP_SVG });
    },
  };
}
