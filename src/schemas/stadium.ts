/**
 * Schemas for the stadium map fixture (`src/data/stadium.geo.json`): the node
 * graph used by Smart Stadium Navigation and the zones used by the crowd
 * management heatmap. The fixture is validated once at load time so a bad
 * edit fails fast rather than corrupting pathfinding.
 */
import { z } from "zod";

export const nodeTypeSchema = z.enum(["gate", "section", "concourse", "amenity"]);
export type NodeType = z.infer<typeof nodeTypeSchema>;

export const amenityKindSchema = z.enum([
  "first-aid",
  "food",
  "prayer-room",
  "sensory-room",
  "accessible-seating",
  "assistive-listening",
  "water-refill",
  "recycling",
]);
export type AmenityKind = z.infer<typeof amenityKindSchema>;

export const stadiumNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: nodeTypeSchema,
  amenity: amenityKindSchema.optional(),
  x: z.number(),
  y: z.number(),
});
export type StadiumNode = z.infer<typeof stadiumNodeSchema>;

export const edgeViaSchema = z.enum(["concourse", "ramp", "stairs", "elevator"]);
export type EdgeVia = z.infer<typeof edgeViaSchema>;

export const stadiumEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  distanceMeters: z.number().positive(),
  stepFree: z.boolean(),
  via: edgeViaSchema,
});
export type StadiumEdge = z.infer<typeof stadiumEdgeSchema>;

export const stadiumZoneSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  capacity: z.number().int().positive(),
  rect: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
});
export type StadiumZone = z.infer<typeof stadiumZoneSchema>;

export const stadiumGeoSchema = z.object({
  venue: z.object({
    name: z.string().min(1),
    viewBox: z.string().min(1),
  }),
  nodes: z.array(stadiumNodeSchema).min(1),
  edges: z.array(stadiumEdgeSchema).min(1),
  zones: z.array(stadiumZoneSchema).min(1),
});
export type StadiumGeo = z.infer<typeof stadiumGeoSchema>;
