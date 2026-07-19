/**
 * Deterministic crowd-density simulator — the demo's stand-in for real
 * turnstile/sensor telemetry, and clearly labeled as simulated in every
 * payload and UI surface. Density follows a slow sine "match rhythm" per zone
 * plus seeded pseudo-random noise, so values are realistic, vary over time,
 * and are fully reproducible: the same timestamp and seed always produce the
 * same snapshot.
 */
import { CROWD_POLL_INTERVAL_MS, CROWD_SIMULATOR_SEED } from "@/lib/constants";
import { getStadiumGraph } from "@/lib/stadium";
import type { CrowdSnapshot, DensityLevel, ZoneDensity } from "@/schemas/crowd";

/** Utilization thresholds mapping to reported density levels. */
const LEVEL_THRESHOLDS: readonly { level: DensityLevel; max: number }[] = [
  { level: "low", max: 0.4 },
  { level: "moderate", max: 0.65 },
  { level: "high", max: 0.85 },
  { level: "critical", max: 1 },
];

/** Trend is "steady" while the change between polls stays inside this band. */
const TREND_EPSILON = 0.015;

/** Full sine cycle of the simulated match rhythm, in poll buckets (~10 min). */
const RHYTHM_PERIOD_BUCKETS = 120;

/** Deterministic 32-bit hash → [0, 1) noise for a (seed, zone, bucket) triple. */
function noise(seed: number, zoneIndex: number, bucket: number): number {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (zoneIndex + 0x1656667b), 0xc2b2ae35);
  h = Math.imul(h ^ (bucket + 0x27d4eb2f), 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2545f491);
  h ^= h >>> 13;
  return (h >>> 0) / 0x1_0000_0000;
}

function utilizationAt(seed: number, zoneIndex: number, bucket: number): number {
  const phase = (zoneIndex * Math.PI) / 5;
  const rhythm = (1 + Math.sin((2 * Math.PI * bucket) / RHYTHM_PERIOD_BUCKETS + phase)) / 2;
  const jitter = noise(seed, zoneIndex, bucket) * 0.2;
  const utilization = 0.12 + rhythm * 0.62 + jitter;
  return Math.min(1, Math.max(0, utilization));
}

function levelFor(utilization: number): DensityLevel {
  const match = LEVEL_THRESHOLDS.find((threshold) => utilization <= threshold.max);
  return match?.level ?? "critical";
}

/**
 * Produces the simulated density snapshot for a moment in time.
 * Deterministic: identical `timestampMs` and `seed` yield identical output.
 */
export function getCrowdSnapshot(
  timestampMs: number = Date.now(),
  seed: number = CROWD_SIMULATOR_SEED,
): CrowdSnapshot {
  const bucket = Math.floor(timestampMs / CROWD_POLL_INTERVAL_MS);
  const zones = getStadiumGraph().geo.zones.map((zone, index): ZoneDensity => {
    const utilization = utilizationAt(seed, index, bucket);
    const previous = utilizationAt(seed, index, bucket - 1);
    const delta = utilization - previous;
    return {
      zoneId: zone.id,
      label: zone.label,
      occupancy: Math.round(utilization * zone.capacity),
      capacity: zone.capacity,
      utilization: Number(utilization.toFixed(3)),
      level: levelFor(utilization),
      trend: Math.abs(delta) <= TREND_EPSILON ? "steady" : delta > 0 ? "rising" : "falling",
    };
  });

  return {
    generatedAtIso: new Date(timestampMs).toISOString(),
    simulated: true,
    zones,
  };
}
