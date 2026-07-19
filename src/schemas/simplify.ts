/**
 * Schemas for the Accessibility Companion's plain-language mode (F4):
 * rewriting announcements at a chosen reading level.
 */
import { z } from "zod";

import { languageSchema } from "./common";

import { MAX_SIMPLIFY_TEXT_LENGTH } from "@/lib/constants";

export const readingLevelSchema = z.enum(["simple", "very-simple"]);
export type ReadingLevel = z.infer<typeof readingLevelSchema>;

export const simplifyRequestSchema = z.strictObject({
  text: z.string().trim().min(5).max(MAX_SIMPLIFY_TEXT_LENGTH),
  readingLevel: readingLevelSchema.default("simple"),
  language: languageSchema.default("en"),
});
export type SimplifyRequest = z.infer<typeof simplifyRequestSchema>;
