import { describe, expect, it } from "vitest";

import { POST } from "./route";

import { jsonRequest, sseEvents } from "@/test/http";

const URL = "https://example.test/api/chat";

interface MetaEvent {
  mocked: boolean;
  sources: { title: string }[];
}

describe("POST /api/chat", () => {
  it("streams a mock answer as SSE meta/token/done events", async () => {
    const response = await POST(jsonRequest(URL, { message: "Where are the prayer rooms?" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/event-stream");

    const raw = await response.text();
    const meta = sseEvents(raw, "meta")[0] as MetaEvent;
    expect(meta.mocked).toBe(true);
    expect(meta.sources).toEqual([]);

    const tokens = sseEvents(raw, "token") as { text: string }[];
    expect(tokens.length).toBeGreaterThan(0);
    const text = tokens.map((token) => token.text).join("");
    expect(text.toLowerCase()).toContain("stadium guide");
    expect(sseEvents(raw, "done")).toHaveLength(1);
  });

  it("attaches cited search sources for live-info questions (F8)", async () => {
    const response = await POST(jsonRequest(URL, { message: "What is the match schedule today?" }));
    const raw = await response.text();
    const meta = sseEvents(raw, "meta")[0] as MetaEvent;
    expect(meta.sources.length).toBeGreaterThan(0);
    expect(meta.sources[0]?.title).toBeTruthy();
  });

  it("answers in the requested language and honors history", async () => {
    const response = await POST(
      jsonRequest(URL, {
        message: "¿Dónde están los baños?",
        language: "es",
        history: [{ role: "user", text: "Hola" }],
      }),
    );
    const raw = await response.text();
    expect(sseEvents(raw, "done")).toHaveLength(1);
  });

  it("rejects an empty message with a 400", async () => {
    const response = await POST(jsonRequest(URL, { message: "" }));
    expect(response.status).toBe(400);
  });

  it("rejects unknown fields with a 400", async () => {
    const response = await POST(jsonRequest(URL, { message: "hi", nope: true }));
    expect(response.status).toBe(400);
  });

  it("rejects an oversized message with a 400", async () => {
    const response = await POST(jsonRequest(URL, { message: "x".repeat(2001) }));
    expect(response.status).toBe(400);
  });
});
