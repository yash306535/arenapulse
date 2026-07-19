import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  HttpError,
  enforceRateLimit,
  errorResponse,
  jsonResponse,
  readJsonBody,
  readQuery,
  toErrorResponse,
} from "./api";

import { SlidingWindowRateLimiter } from "@/lib/security/rate-limit";
import type { ErrorEnvelope } from "@/schemas/common";

const bodySchema = z.strictObject({ name: z.string().min(1) });
const querySchema = z.strictObject({ q: z.string().min(2) });

function post(body: unknown): Request {
  return new Request("https://example.test/api", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("jsonResponse", () => {
  it("serializes data with a JSON content type and status", async () => {
    const response = jsonResponse({ ok: true }, 201);
    expect(response.status).toBe(201);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe("errorResponse", () => {
  it("wraps errors in the uniform envelope and merges headers", async () => {
    const response = errorResponse("rate_limited", "Slow down", 429, { "retry-after": "5" });
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("5");
    const payload = (await response.json()) as ErrorEnvelope;
    expect(payload.error).toEqual({ code: "rate_limited", message: "Slow down" });
  });
});

describe("toErrorResponse", () => {
  it("passes an HttpError through verbatim", async () => {
    const response = toErrorResponse(new HttpError("not_found", 404, "Missing"));
    expect(response.status).toBe(404);
    const payload = (await response.json()) as ErrorEnvelope;
    expect(payload.error.code).toBe("not_found");
  });

  it("maps unknown errors to a generic 500 without leaking details", async () => {
    const response = toErrorResponse(new Error("db password is hunter2"));
    expect(response.status).toBe(500);
    const payload = (await response.json()) as ErrorEnvelope;
    expect(payload.error.code).toBe("internal_error");
    expect(JSON.stringify(payload)).not.toContain("hunter2");
  });
});

describe("readJsonBody", () => {
  it("returns the parsed value on valid input", async () => {
    await expect(readJsonBody(post({ name: "Ada" }), bodySchema)).resolves.toEqual({ name: "Ada" });
  });

  it("rejects malformed JSON with a 400 HttpError", async () => {
    await expect(readJsonBody(post("{not json"), bodySchema)).rejects.toMatchObject({
      status: 400,
      code: "invalid_request",
    });
  });

  it("rejects input that violates the schema", async () => {
    await expect(readJsonBody(post({ name: "" }), bodySchema)).rejects.toBeInstanceOf(HttpError);
  });

  it("rejects unknown fields on strict schemas", async () => {
    await expect(readJsonBody(post({ name: "Ada", extra: 1 }), bodySchema)).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("readQuery", () => {
  it("parses and validates query parameters", () => {
    const request = new Request("https://example.test/api?q=hello");
    expect(readQuery(request, querySchema)).toEqual({ q: "hello" });
  });

  it("rejects invalid query parameters with a 400", () => {
    const request = new Request("https://example.test/api?q=x");
    expect(() => readQuery(request, querySchema)).toThrow(HttpError);
  });
});

describe("enforceRateLimit", () => {
  it("allows requests under the limit", () => {
    const limiter = new SlidingWindowRateLimiter(2);
    const request = new Request("https://example.test/api", {
      headers: { "x-forwarded-for": "198.51.100.7" },
    });
    expect(() => {
      enforceRateLimit(request, limiter);
    }).not.toThrow();
  });

  it("throws a 429 with Retry-After once the limit is exceeded", () => {
    const limiter = new SlidingWindowRateLimiter(1);
    const request = new Request("https://example.test/api", {
      headers: { "x-forwarded-for": "198.51.100.8" },
    });
    enforceRateLimit(request, limiter);
    try {
      enforceRateLimit(request, limiter);
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      const httpError = error as HttpError;
      expect(httpError.status).toBe(429);
      expect(httpError.headers?.["retry-after"]).toBeDefined();
    }
  });
});
