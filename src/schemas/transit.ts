/**
 * Schemas for the Transit & Parking Planner (F5): transportation planning
 * requests and the normalized plan shape shared by the live Google Maps
 * service and its mock twin.
 */
import { z } from "zod";

import { MAX_QUERY_LENGTH } from "@/lib/constants";

export const travelModeSchema = z.enum(["transit", "drive", "walk"]);
export type TravelMode = z.infer<typeof travelModeSchema>;

export const transitRequestSchema = z.strictObject({
  matchId: z.string().min(1).max(50),
  origin: z.string().trim().min(2).max(MAX_QUERY_LENGTH),
  mode: travelModeSchema,
});
export type TransitRequest = z.infer<typeof transitRequestSchema>;

export const transitStepSchema = z.object({
  instruction: z.string().min(1),
  durationMinutes: z.number().nonnegative(),
  distanceKm: z.number().nonnegative(),
});
export type TransitStep = z.infer<typeof transitStepSchema>;

export const transitPlanSchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  mode: travelModeSchema,
  steps: z.array(transitStepSchema).min(1),
  totalDurationMinutes: z.number().positive(),
  totalDistanceKm: z.number().positive(),
  mocked: z.boolean(),
});
export type TransitPlan = z.infer<typeof transitPlanSchema>;
