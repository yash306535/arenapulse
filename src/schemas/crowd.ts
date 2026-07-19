/**
 * Schemas for Crowd Intelligence (F3): the simulated density snapshot and the
 * structured AI recommendation payload. AI output schemas deliberately use
 * non-strict objects — unexpected extra keys from the model are stripped, but
 * every field we rely on is still validated before render.
 */
import { z } from "zod";

export const densityLevelSchema = z.enum(["low", "moderate", "high", "critical"]);
export type DensityLevel = z.infer<typeof densityLevelSchema>;

export const zoneDensitySchema = z.object({
  zoneId: z.string().min(1),
  label: z.string().min(1),
  occupancy: z.number().int().nonnegative(),
  capacity: z.number().int().positive(),
  utilization: z.number().min(0).max(1),
  level: densityLevelSchema,
  trend: z.enum(["rising", "falling", "steady"]),
});
export type ZoneDensity = z.infer<typeof zoneDensitySchema>;

export const crowdSnapshotSchema = z.object({
  generatedAtIso: z.string().min(1),
  simulated: z.literal(true),
  zones: z.array(zoneDensitySchema).min(1),
});
export type CrowdSnapshot = z.infer<typeof crowdSnapshotSchema>;

/** Structured output contract for Gemini crowd recommendations. */
export const crowdRecommendationSchema = z.object({
  summary: z.string().min(1).max(600),
  alerts: z
    .array(
      z.object({
        zoneId: z.string().min(1),
        severity: z.enum(["info", "warning", "critical"]),
        headline: z.string().min(1).max(160),
        action: z.string().min(1).max(300),
      }),
    )
    .max(8),
  gateReroutes: z
    .array(
      z.object({
        fromGate: z.string().min(1),
        toGate: z.string().min(1),
        reason: z.string().min(1).max(200),
      }),
    )
    .max(4),
  staffingMoves: z
    .array(
      z.object({
        zoneId: z.string().min(1),
        action: z.string().min(1).max(200),
        staffCount: z.number().int().min(1).max(50),
      }),
    )
    .max(6),
});
export type CrowdRecommendation = z.infer<typeof crowdRecommendationSchema>;
