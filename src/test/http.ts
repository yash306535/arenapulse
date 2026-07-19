/**
 * Test-only helpers for exercising API route handlers. Each request gets a
 * unique client IP so the shared in-memory rate limiters do not leak state
 * between test cases. Excluded from coverage (see vitest.config.ts).
 */

let ipCounter = 0;

/** Returns a fresh, unique `x-forwarded-for` value for an isolated rate-limit bucket. */
export function uniqueIp(): string {
  ipCounter += 1;
  return `203.0.113.${String(ipCounter % 250)}#${String(ipCounter)}`;
}

/** Builds a JSON POST Request with an isolated rate-limit key. */
export function jsonRequest(url: string, body: unknown, ip: string = uniqueIp()): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

/** Builds a GET Request with an isolated rate-limit key. */
export function getRequest(url: string, ip: string = uniqueIp()): Request {
  return new Request(url, { method: "GET", headers: { "x-forwarded-for": ip } });
}

/** Reads a full Server-Sent Events response body into its raw text. */
export async function readSse(response: Response): Promise<string> {
  return response.text();
}

/** Parses the `data:` payloads of SSE frames matching `event`. */
export function sseEvents(raw: string, event: string): unknown[] {
  return raw
    .split("\n\n")
    .filter((frame) => frame.includes(`event: ${event}`))
    .map((frame) => {
      const line = frame.split("\n").find((part) => part.startsWith("data: "));
      return line === undefined ? null : (JSON.parse(line.slice("data: ".length)) as unknown);
    });
}
