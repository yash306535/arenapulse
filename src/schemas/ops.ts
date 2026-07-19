/**
 * Schemas for the Ops Command Center (F7): the incident log used for
 * operational intelligence and the structured AI shift-briefing contract.
 */
import { z } from "zod";

import { MAX_INCIDENT_DESCRIPTION_LENGTH } from "@/lib/constants";

export const incidentCategorySchema = z.enum([
  "medical",
  "security",
  "facilities",
  "crowd",
  "lost-item",
]);
export type IncidentCategory = z.infer<typeof incidentCategorySchema>;

export const incidentSeveritySchema = z.enum(["low", "medium", "high"]);
export type IncidentSeverity = z.infer<typeof incidentSeveritySchema>;

export const incidentStatusSchema = z.enum(["open", "monitoring", "resolved"]);
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;

export const incidentCreateSchema = z.strictObject({
  zoneId: z.string().min(1).max(50),
  category: incidentCategorySchema,
  severity: incidentSeveritySchema,
  description: z.string().trim().min(5).max(MAX_INCIDENT_DESCRIPTION_LENGTH),
  reportedBy: z.enum(["staff", "volunteer", "organizer"]),
});
export type IncidentCreate = z.infer<typeof incidentCreateSchema>;

export const incidentSchema = z.object({
  id: z.string().min(1),
  createdAtIso: z.string().min(1),
  status: incidentStatusSchema,
  zoneId: z.string().min(1),
  category: incidentCategorySchema,
  severity: incidentSeveritySchema,
  description: z.string().min(1),
  reportedBy: z.enum(["staff", "volunteer", "organizer"]),
});
export type Incident = z.infer<typeof incidentSchema>;

/** Structured output contract for the Gemini-generated shift briefing. */
export const briefingSchema = z.object({
  headline: z.string().min(1).max(160),
  overview: z.string().min(1).max(800),
  keyPoints: z.array(z.string().min(1).max(300)).min(1).max(8),
  risks: z
    .array(
      z.object({
        risk: z.string().min(1).max(200),
        mitigation: z.string().min(1).max(300),
      }),
    )
    .max(6),
  staffingActions: z.array(z.string().min(1).max(300)).max(6),
  zonesToWatch: z
    .array(
      z.object({
        zoneId: z.string().min(1),
        reason: z.string().min(1).max(200),
      }),
    )
    .max(5),
});
export type Briefing = z.infer<typeof briefingSchema>;
