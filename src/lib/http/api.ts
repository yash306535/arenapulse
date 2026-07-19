/**
 * Shared HTTP helpers for API route handlers. Centralizes the concerns every
 * route repeats — rate limiting, zod validation of body/query, the uniform
 * error envelope, and JSON responses — so each handler stays thin (validate →
 * call a lib service → shape the response) and never leaks internals to the
 * client. Error details are logged; clients receive safe generic messages.
 */
import type { z } from "zod";

import { logger } from "@/lib/logger";
import { getClientKey, type SlidingWindowRateLimiter } from "@/lib/security/rate-limit";
import type { ErrorEnvelope } from "@/schemas/common";

const JSON_CONTENT_TYPE = "application/json";

/**
 * A client-facing failure with a safe message, HTTP status, and optional
 * headers (e.g. `Retry-After`). Thrown by helpers and mapped to a response by
 * {@link toErrorResponse}, so handlers need only a single try/catch.
 */
export class HttpError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly clientMessage: string,
    readonly headers?: Readonly<Record<string, string>>,
  ) {
    super(clientMessage);
    this.name = "HttpError";
  }
}

/** Serializes `data` as a JSON response with the given status. */
export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": JSON_CONTENT_TYPE },
  });
}

/** Builds the uniform `{ error: { code, message } }` envelope response. */
export function errorResponse(
  code: string,
  message: string,
  status: number,
  headers?: Readonly<Record<string, string>>,
): Response {
  const envelope: ErrorEnvelope = { error: { code, message } };
  return new Response(JSON.stringify(envelope), {
    status,
    headers: { "content-type": JSON_CONTENT_TYPE, ...headers },
  });
}

/** Maps any thrown value to a safe response — {@link HttpError} verbatim, everything else a generic 500. */
export function toErrorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return errorResponse(error.code, error.clientMessage, error.status, error.headers);
  }
  logger.error("Unhandled API route error", {
    reason: error instanceof Error ? error.message : "unknown",
  });
  return errorResponse("internal_error", "Something went wrong. Please try again.", 500);
}

/** Records the request against `limiter`; throws a 429 {@link HttpError} with `Retry-After` when over budget. */
export function enforceRateLimit(request: Request, limiter: SlidingWindowRateLimiter): void {
  const decision = limiter.check(getClientKey(request));
  if (!decision.allowed) {
    throw new HttpError(
      "rate_limited",
      429,
      "Too many requests. Please slow down and try again shortly.",
      { "retry-after": String(decision.retryAfterSeconds ?? 60) },
    );
  }
}

function validate<T>(schema: z.ZodType<T>, raw: unknown): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    logger.warn("Rejected invalid API input", {
      fields: result.error.issues.map((issue) => issue.path.join(".") || "(root)"),
    });
    throw new HttpError(
      "invalid_request",
      400,
      "The request was invalid. Please check your input and try again.",
    );
  }
  return result.data;
}

/** Parses and validates a JSON request body; throws a 400 {@link HttpError} on malformed or invalid input. */
export async function readJsonBody<T>(request: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new HttpError("invalid_request", 400, "Request body must be valid JSON.");
  }
  return validate(schema, raw);
}

/** Parses and validates URL query parameters against `schema`; throws a 400 {@link HttpError} on invalid input. */
export function readQuery<T>(request: Request, schema: z.ZodType<T>): T {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  return validate(schema, params);
}
