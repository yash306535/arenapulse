import { describe, expect, it } from "vitest";

import { SlidingWindowRateLimiter, getClientKey } from "./rate-limit";

function buildLimiter(
  maxRequests: number,
  windowMs: number,
): {
  limiter: SlidingWindowRateLimiter;
  advance: (ms: number) => void;
} {
  let nowMs = 0;
  const limiter = new SlidingWindowRateLimiter(maxRequests, windowMs, () => nowMs);
  return {
    limiter,
    advance: (ms: number) => {
      nowMs += ms;
    },
  };
}

describe("SlidingWindowRateLimiter", () => {
  it("allows requests up to the limit and rejects the next one", () => {
    const { limiter } = buildLimiter(3, 60_000);
    expect(limiter.check("ip").allowed).toBe(true);
    expect(limiter.check("ip").allowed).toBe(true);
    expect(limiter.check("ip").allowed).toBe(true);
    const denied = limiter.check("ip");
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    expect(denied.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("tracks keys independently", () => {
    const { limiter } = buildLimiter(1, 60_000);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
  });

  it("allows again after the window rolls over", () => {
    const { limiter, advance } = buildLimiter(2, 60_000);
    limiter.check("ip");
    advance(30_000);
    limiter.check("ip");
    expect(limiter.check("ip").allowed).toBe(false);
    advance(30_001);
    expect(limiter.check("ip").allowed).toBe(true);
    expect(limiter.check("ip").allowed).toBe(false);
  });

  it("computes retryAfterSeconds from the oldest in-window request", () => {
    const { limiter, advance } = buildLimiter(1, 60_000);
    limiter.check("ip");
    advance(45_000);
    const denied = limiter.check("ip");
    expect(denied.retryAfterSeconds).toBe(15);
  });

  it("rejects invalid construction parameters", () => {
    expect(() => new SlidingWindowRateLimiter(0)).toThrow(RangeError);
    expect(() => new SlidingWindowRateLimiter(10, -5)).toThrow(RangeError);
  });
});

describe("getClientKey", () => {
  it("uses the first x-forwarded-for entry", () => {
    const request = new Request("http://localhost/api", {
      headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" },
    });
    expect(getClientKey(request)).toBe("203.0.113.7");
  });

  it("falls back to x-real-ip, then to a shared local key", () => {
    const withRealIp = new Request("http://localhost/api", {
      headers: { "x-real-ip": "198.51.100.2" },
    });
    expect(getClientKey(withRealIp)).toBe("198.51.100.2");
    expect(getClientKey(new Request("http://localhost/api"))).toBe("local");
  });
});
