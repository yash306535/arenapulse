/**
 * Parsing helpers for structured (JSON) model output. AI output is untrusted:
 * everything is zod-validated before use, and markdown code fences that some
 * models wrap around JSON are stripped first.
 */
import type { z } from "zod";

/** Raised when model output cannot be parsed into the expected schema. */
export class AiOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiOutputError";
  }
}

/**
 * Parses raw model text into a schema-validated value.
 * Throws {@link AiOutputError} on empty, non-JSON, or schema-violating output.
 */
export function parseModelJson<T>(schema: z.ZodType<T>, raw: string | undefined): T {
  if (raw === undefined || raw.trim() === "") {
    throw new AiOutputError("Model returned an empty response");
  }
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    throw new AiOutputError("Model response was not valid JSON");
  }
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new AiOutputError("Model JSON did not match the expected schema");
  }
  return result.data;
}
