/**
 * Typed environment configuration. This module is the only place in the app
 * that reads `process.env`. Parsed once with zod at first import, frozen, and
 * exported as `env`. Server-only: keys must never reach the client bundle.
 */
import "server-only";

import { z } from "zod";

/** Treats empty-string env vars as absent so `KEY=""` cannot half-enable a service. */
const optionalSecret = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  GEMINI_API_KEY: optionalSecret,
  GEMINI_MODEL: z
    .preprocess((value) => (value === "" ? undefined : value), z.string().min(1))
    .default("gemini-2.5-flash"),
  GOOGLE_MAPS_API_KEY: optionalSecret,
  GOOGLE_SEARCH_API_KEY: optionalSecret,
  GOOGLE_SEARCH_CX: optionalSecret,
  MOCK_MODE: z.enum(["true", "false"]).default("false"),
});

/** Parsed, camel-cased application environment. */
export interface AppEnv {
  readonly nodeEnv: "development" | "test" | "production";
  readonly geminiApiKey: string | undefined;
  readonly geminiModel: string;
  readonly mapsApiKey: string | undefined;
  readonly searchApiKey: string | undefined;
  readonly searchCx: string | undefined;
  readonly mockMode: boolean;
}

/** External services that have a mock twin for keyless demo mode. */
export type ServiceName = "gemini" | "maps" | "search";

/**
 * Parses a raw environment map into a typed {@link AppEnv}.
 * Exported separately from the singleton so tests can exercise it directly.
 * Throws with variable *names* only — never values — on invalid input.
 */
export function parseEnv(raw: Record<string, string | undefined>): AppEnv {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
    throw new Error(`Invalid environment configuration for: ${names.join(", ")}`);
  }
  const parsed = result.data;
  return Object.freeze({
    nodeEnv: parsed.NODE_ENV,
    geminiApiKey: parsed.GEMINI_API_KEY,
    geminiModel: parsed.GEMINI_MODEL,
    mapsApiKey: parsed.GOOGLE_MAPS_API_KEY,
    searchApiKey: parsed.GOOGLE_SEARCH_API_KEY,
    searchCx: parsed.GOOGLE_SEARCH_CX,
    mockMode: parsed.MOCK_MODE === "true",
  });
}

/**
 * Reports whether a service must run against its deterministic mock twin —
 * true when `MOCK_MODE=true` or when the service's key material is missing.
 */
export function isServiceMocked(config: AppEnv, service: ServiceName): boolean {
  if (config.mockMode) {
    return true;
  }
  switch (service) {
    case "gemini":
      return config.geminiApiKey === undefined;
    case "maps":
      return config.mapsApiKey === undefined;
    case "search":
      return config.searchApiKey === undefined || config.searchCx === undefined;
  }
}

/** The application environment, parsed once at startup. */
export const env: AppEnv = parseEnv(process.env);
