import { describe, expect, it } from "vitest";

import { POST } from "./route";

import { jsonRequest } from "@/test/http";

const URL = "https://example.test/api/simplify";

interface SimplifyResponse {
  text: string;
  mocked: boolean;
}

describe("POST /api/simplify", () => {
  it("rewrites an announcement into plain language", async () => {
    const response = await POST(
      jsonRequest(URL, {
        text: "Spectators are prohibited from bringing prohibited items; please proceed to Gate A.",
        readingLevel: "very-simple",
        language: "en",
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as SimplifyResponse;
    expect(body.mocked).toBe(true);
    expect(body.text.toLowerCase()).toContain("not allowed");
  });

  it("rejects text below the minimum length with a 400", async () => {
    const response = await POST(jsonRequest(URL, { text: "hi" }));
    expect(response.status).toBe(400);
  });

  it("rejects an oversized payload with a 400", async () => {
    const response = await POST(jsonRequest(URL, { text: "x".repeat(4001) }));
    expect(response.status).toBe(400);
  });
});
