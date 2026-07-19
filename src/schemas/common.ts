/**
 * Shared vocabulary schemas: languages, roles, and the API error envelope.
 * All request/response shapes across the app derive from these primitives.
 */
import { z } from "zod";

/** Languages offered as quick-select chips in the multilingual assistant. */
export const LANGUAGES = ["en", "es", "fr", "ar", "pt", "hi"] as const;

export const languageSchema = z.enum(LANGUAGES);
export type Language = z.infer<typeof languageSchema>;

/** UI languages with full dictionary coverage (host-country languages). */
export const UI_LANGUAGES = ["en", "es", "fr"] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

/** Audience roles served by the role switcher (organizer covers venue staff). */
export const ROLES = ["fan", "volunteer", "organizer"] as const;

export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

/** Uniform error envelope returned by every API route on failure. */
export const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
