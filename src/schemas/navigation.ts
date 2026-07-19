/**
 * Schemas for Smart Stadium Navigation (F2): route requests against the
 * stadium graph and the computed route payload returned to the client.
 */
import { z } from "zod";

import { languageSchema } from "./common";
import { edgeViaSchema } from "./stadium";

const nodeIdSchema = z.string().min(1).max(50);

export const directionsRequestSchema = z.strictObject({
  originId: nodeIdSchema,
  destinationId: nodeIdSchema,
  stepFreeOnly: z.boolean().default(false),
  language: languageSchema.default("en"),
});
export type DirectionsRequest = z.infer<typeof directionsRequestSchema>;

export const routeStepSchema = z.object({
  fromId: nodeIdSchema,
  toId: nodeIdSchema,
  fromLabel: z.string().min(1),
  toLabel: z.string().min(1),
  distanceMeters: z.number().positive(),
  via: edgeViaSchema,
  stepFree: z.boolean(),
});
export type RouteStep = z.infer<typeof routeStepSchema>;

export const routeResultSchema = z.object({
  nodeIds: z.array(nodeIdSchema).min(1),
  steps: z.array(routeStepSchema),
  totalDistanceMeters: z.number().nonnegative(),
  stepFree: z.boolean(),
});
export type RouteResult = z.infer<typeof routeResultSchema>;
