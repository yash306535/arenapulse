/**
 * Sliding-window rate limiter, keyed by client IP. Protects the GenAI routes
 * (20 req/min) and standard routes (60 req/min) from abuse and runaway cost.
 *
 * Serverless caveat: state lives in instance memory, so each serverless
 * instance enforces the limit independently and cold starts reset windows.
 * That is acceptable for this demo; production deployments should back the
 * limiter with a shared store (e.g. Redis) or an API gateway policy.
 */
import {
  AI_RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MS,
  STANDARD_RATE_LIMIT_MAX_REQUESTS,
} from "@/lib/constants";

/** Cap on distinct tracked clients — prevents unbounded memory growth. */
const MAX_TRACKED_KEYS = 10_000;

/** Outcome of a rate-limit check. */
export interface RateLimitDecision {
  readonly allowed: boolean;
  /** Seconds the client should wait before retrying; set when not allowed. */
  readonly retryAfterSeconds?: number;
}

/** Counts requests per key inside a rolling time window. */
export class SlidingWindowRateLimiter {
  private readonly requestLog = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number = RATE_LIMIT_WINDOW_MS,
    private readonly now: () => number = Date.now,
  ) {
    if (maxRequests <= 0 || windowMs <= 0) {
      throw new RangeError("Rate limiter requires positive limits");
    }
  }

  /** Records an attempt for `key` and reports whether it is allowed. */
  check(key: string): RateLimitDecision {
    const currentMs = this.now();
    const windowStart = currentMs - this.windowMs;
    const recent = (this.requestLog.get(key) ?? []).filter((ts) => ts > windowStart);

    if (recent.length >= this.maxRequests) {
      const oldest = recent[0] ?? currentMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((oldest + this.windowMs - currentMs) / 1000));
      this.requestLog.set(key, recent);
      return { allowed: false, retryAfterSeconds };
    }

    if (!this.requestLog.has(key) && this.requestLog.size >= MAX_TRACKED_KEYS) {
      const oldestKey = this.requestLog.keys().next().value;
      if (oldestKey !== undefined) {
        this.requestLog.delete(oldestKey);
      }
    }
    recent.push(currentMs);
    this.requestLog.set(key, recent);
    return { allowed: true };
  }
}

/** Shared limiter for expensive GenAI-backed routes. */
export const aiRateLimiter = new SlidingWindowRateLimiter(AI_RATE_LIMIT_MAX_REQUESTS);

/** Shared limiter for all other API routes. */
export const standardRateLimiter = new SlidingWindowRateLimiter(STANDARD_RATE_LIMIT_MAX_REQUESTS);

/**
 * Derives the rate-limit key for a request from proxy headers.
 * Falls back to a shared key when no client IP is available (local dev).
 */
export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first !== undefined && first !== "") {
    return first;
  }
  return request.headers.get("x-real-ip") ?? "local";
}
