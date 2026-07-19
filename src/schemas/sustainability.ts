/**
 * Schemas for the Sustainability Hub (F6): carbon comparison inputs and the
 * personalized AI sustainability tip request.
 */
import { z } from "zod";

export const carbonModeSchema = z.enum(["walk", "bike", "metro", "bus", "carpool", "car"]);
export type CarbonMode = z.infer<typeof carbonModeSchema>;

/** Distance bound keeps the calculator honest — no continent-scale commutes. */
export const MAX_TRIP_DISTANCE_KM = 500;

export const sustainabilityTipRequestSchema = z.strictObject({
  mode: carbonModeSchema,
  distanceKm: z.number().positive().max(MAX_TRIP_DISTANCE_KM),
});
export type SustainabilityTipRequest = z.infer<typeof sustainabilityTipRequestSchema>;
