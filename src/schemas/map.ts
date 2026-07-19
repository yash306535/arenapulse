/**
 * Schema for the proxied Static Maps route (F5). Query parameters arrive as
 * strings and are coerced to bounded integers so the map-image route can never
 * be used to request arbitrary upstream sizes/zoom levels.
 */
import { z } from "zod";

import {
  STATIC_MAP_DEFAULT_ZOOM,
  STATIC_MAP_MAX_SIZE_PX,
  STATIC_MAP_MAX_ZOOM,
  STATIC_MAP_MIN_SIZE_PX,
  STATIC_MAP_MIN_ZOOM,
} from "@/lib/constants";

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 400;

export const staticMapQuerySchema = z.strictObject({
  width: z.coerce
    .number()
    .int()
    .min(STATIC_MAP_MIN_SIZE_PX)
    .max(STATIC_MAP_MAX_SIZE_PX)
    .default(DEFAULT_WIDTH),
  height: z.coerce
    .number()
    .int()
    .min(STATIC_MAP_MIN_SIZE_PX)
    .max(STATIC_MAP_MAX_SIZE_PX)
    .default(DEFAULT_HEIGHT),
  zoom: z.coerce
    .number()
    .int()
    .min(STATIC_MAP_MIN_ZOOM)
    .max(STATIC_MAP_MAX_ZOOM)
    .default(STATIC_MAP_DEFAULT_ZOOM),
});
export type StaticMapQuery = z.infer<typeof staticMapQuerySchema>;
