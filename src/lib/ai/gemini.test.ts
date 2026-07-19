import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { createRealGeminiService, getGeminiService } from "./gemini";
import type { GenerativeModelsClient } from "./gemini";
import { AiOutputError, parseModelJson } from "./json";

import { getCrowdSnapshot } from "@/lib/crowd/simulator";
import { listIncidents } from "@/lib/ops/incidents";
import { crowdRecommendationSchema } from "@/schemas/crowd";

function fakeStream(chunks: string[]): AsyncGenerator<{ text: string | undefined }> {
  async function* generate(): AsyncGenerator<{ text: string | undefined }> {
    for (const text of chunks) {
      yield await Promise.resolve({ text });
    }
  }
  return generate();
}

function fakeClient(overrides: Partial<GenerativeModelsClient>): GenerativeModelsClient {
  return {
    generateContent: vi.fn().mockResolvedValue({ text: "ok" }),
    generateContentStream: vi.fn().mockResolvedValue(fakeStream(["ok"])),
    ...overrides,
  };
}

async function collect(stream: AsyncGenerator<string>): Promise<string> {
  let text = "";
  for await (const chunk of stream) {
    text += chunk;
  }
  return text;
}

const snapshot = getCrowdSnapshot(1_750_000_000_000, 42);

describe("createRealGeminiService streaming", () => {
  it("yields chunks from the model stream", async () => {
    const client = fakeClient({
      generateContentStream: vi.fn().mockResolvedValue(fakeStream(["Hola ", "", "fan!"])),
    });
    const service = createRealGeminiService(client);
    const text = await collect(service.streamChat({ message: "hola", history: [] }));
    expect(text).toBe("Hola fan!");
  });

  it("sends history and a delimited user message", async () => {
    const generateContentStream = vi.fn().mockResolvedValue(fakeStream(["ok"]));
    const service = createRealGeminiService(fakeClient({ generateContentStream }));
    await collect(
      service.streamChat({
        message: "Where is first aid?",
        history: [
          { role: "user", text: "hi" },
          { role: "model", text: "hello" },
        ],
        language: "fr",
      }),
    );
    const params = generateContentStream.mock.calls[0]?.[0] as {
      contents: { role: string; parts: { text: string }[] }[];
      config: { systemInstruction: string };
    };
    expect(params.contents).toHaveLength(3);
    expect(params.contents[2]?.parts[0]?.text).toContain("FAN MESSAGE");
    expect(params.config.systemInstruction).toContain("Reply in French");
  });

  it("falls back to the mock stream when the live call fails", async () => {
    const client = fakeClient({
      generateContentStream: vi.fn().mockRejectedValue(new Error("upstream down")),
    });
    const service = createRealGeminiService(client);
    const text = await collect(service.streamChat({ message: "When do gates open?", history: [] }));
    expect(text).toContain("Gates open 3 hours before kickoff");
  });
});

describe("createRealGeminiService structured output", () => {
  const validRecommendation = {
    summary: "North concourse trending high.",
    alerts: [],
    gateReroutes: [],
    staffingMoves: [],
  };

  it("parses valid JSON on the first attempt", async () => {
    const generateContent = vi
      .fn()
      .mockResolvedValue({ text: JSON.stringify(validRecommendation) });
    const service = createRealGeminiService(fakeClient({ generateContent }));
    const result = await service.recommendCrowdActions(snapshot);
    expect(result.summary).toBe("North concourse trending high.");
    expect(generateContent).toHaveBeenCalledTimes(1);
  });

  it("retries once on malformed output, then succeeds", async () => {
    const generateContent = vi
      .fn()
      .mockResolvedValueOnce({ text: "not json at all" })
      .mockResolvedValueOnce({ text: JSON.stringify(validRecommendation) });
    const service = createRealGeminiService(fakeClient({ generateContent }));
    const result = await service.recommendCrowdActions(snapshot);
    expect(result.summary).toBe("North concourse trending high.");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });

  it("falls back to the deterministic mock after two failures", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: "{broken" });
    const service = createRealGeminiService(fakeClient({ generateContent }));
    const result = await service.recommendCrowdActions(snapshot);
    expect(generateContent).toHaveBeenCalledTimes(2);
    expect(() => crowdRecommendationSchema.parse(result)).not.toThrow();
  });

  it("briefing falls back gracefully too", async () => {
    const generateContent = vi.fn().mockRejectedValue(new Error("timeout"));
    const service = createRealGeminiService(fakeClient({ generateContent }));
    const briefing = await service.generateBriefing(listIncidents(), snapshot);
    expect(briefing.keyPoints.length).toBeGreaterThan(0);
  });
});

describe("createRealGeminiService text output", () => {
  it("returns trimmed model text", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: "  Leave by 17:00.  " });
    const service = createRealGeminiService(fakeClient({ generateContent }));
    const advice = await service.simplifyText({
      text: "Please vacate the premises promptly.",
      readingLevel: "simple",
      language: "en",
    });
    expect(advice).toBe("Leave by 17:00.");
  });

  it("treats empty text as failure and falls back", async () => {
    const generateContent = vi.fn().mockResolvedValue({ text: "" });
    const service = createRealGeminiService(fakeClient({ generateContent }));
    const result = await service.simplifyText({
      text: "Re-entry is prohibited.",
      readingLevel: "simple",
      language: "en",
    });
    expect(result).toContain("not allowed");
  });
});

describe("getGeminiService", () => {
  it("returns the mock twin when no key is configured (test env)", () => {
    const service = getGeminiService();
    expect(service.mocked).toBe(true);
    expect(getGeminiService()).toBe(service);
  });
});

describe("parseModelJson", () => {
  const schema = z.object({ ok: z.boolean() });

  it("parses plain and fenced JSON", () => {
    expect(parseModelJson(schema, '{"ok": true}')).toEqual({ ok: true });
    expect(parseModelJson(schema, '```json\n{"ok": true}\n```')).toEqual({ ok: true });
  });

  it("throws AiOutputError on empty, invalid, or schema-violating output", () => {
    expect(() => parseModelJson(schema, undefined)).toThrow(AiOutputError);
    expect(() => parseModelJson(schema, "  ")).toThrow(AiOutputError);
    expect(() => parseModelJson(schema, "nope")).toThrow(AiOutputError);
    expect(() => parseModelJson(schema, '{"ok": "yes"}')).toThrow(AiOutputError);
  });
});
