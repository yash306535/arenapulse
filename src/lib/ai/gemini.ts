/**
 * Gemini service layer (server-only). Defines the shared GeminiService
 * contract, implements it against the @google/genai SDK, and transparently
 * falls back to the deterministic mock twin — per call on validation/network
 * failure, or entirely when no API key is configured (demo mode).
 *
 * Requests time out after OUTBOUND_REQUEST_TIMEOUT_MS via AbortSignal, output
 * tokens are capped, and every structured response is zod-validated with one
 * retry before the graceful fallback (see SECURITY.md).
 */
import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { GenerateContentParameters } from "@google/genai";
import { z } from "zod";

import { createMockGeminiService } from "./gemini.mock";
import { parseModelJson } from "./json";
import {
  assistantSystemPrompt,
  briefingPrompt,
  crowdRecommendationPrompt,
  routeNarrationPrompt,
  searchResultsContext,
  simplifyPrompt,
  sustainabilityTipPrompt,
  transitAdvicePrompt,
  wrapUntrusted,
} from "./prompts";

import { MAX_AI_OUTPUT_TOKENS, OUTBOUND_REQUEST_TIMEOUT_MS } from "@/lib/constants";
import { env, isServiceMocked } from "@/lib/env";
import { kbAsContext } from "@/lib/kb";
import { logger } from "@/lib/logger";
import { describeRoute } from "@/lib/navigation/pathfinder";
import type { ModeComparison } from "@/lib/sustainability/carbon";
import type { ChatTurn } from "@/schemas/chat";
import type { Language } from "@/schemas/common";
import { crowdRecommendationSchema } from "@/schemas/crowd";
import type { CrowdRecommendation, CrowdSnapshot } from "@/schemas/crowd";
import type { RouteResult } from "@/schemas/navigation";
import { briefingSchema } from "@/schemas/ops";
import type { Briefing, Incident } from "@/schemas/ops";
import type { SimplifyRequest } from "@/schemas/simplify";
import type { TransitPlan } from "@/schemas/transit";

/** Input for a streamed assistant conversation turn. */
export interface ChatStreamRequest {
  readonly message: string;
  readonly history: ChatTurn[];
  readonly language?: Language;
  /** Pre-formatted, clearly-labeled untrusted live search context (F8). */
  readonly searchContext?: string;
}

/** The AI capability surface consumed by API routes. */
export interface GeminiService {
  readonly mocked: boolean;
  streamChat(request: ChatStreamRequest): AsyncGenerator<string, void, undefined>;
  narrateRoute(route: RouteResult, language: Language): Promise<string>;
  recommendCrowdActions(snapshot: CrowdSnapshot): Promise<CrowdRecommendation>;
  generateBriefing(incidents: Incident[], snapshot: CrowdSnapshot): Promise<Briefing>;
  simplifyText(request: SimplifyRequest): Promise<string>;
  sustainabilityTip(comparison: ModeComparison[], mode: string): Promise<string>;
  transitAdvice(plan: TransitPlan, kickoffIso: string, leaveByIso: string): Promise<string>;
}

/** Minimal structural view of the SDK's `models` API — injectable for tests. */
export interface GenerativeModelsClient {
  generateContent(params: GenerateContentParameters): Promise<{ text: string | undefined }>;
  generateContentStream(
    params: GenerateContentParameters,
  ): Promise<AsyncGenerator<{ text: string | undefined }>>;
}

function baseConfig(temperature: number): {
  temperature: number;
  maxOutputTokens: number;
  abortSignal: AbortSignal;
} {
  return {
    temperature,
    maxOutputTokens: MAX_AI_OUTPUT_TOKENS,
    abortSignal: AbortSignal.timeout(OUTBOUND_REQUEST_TIMEOUT_MS),
  };
}

/**
 * Creates the live Gemini-backed service. The models client is injectable so
 * tests can exercise streaming, JSON validation, retry, and fallback logic
 * without any network access.
 */
export function createRealGeminiService(models: GenerativeModelsClient): GeminiService {
  const fallback = createMockGeminiService();

  async function generateText(prompt: string, temperature: number): Promise<string> {
    const response = await models.generateContent({
      model: env.geminiModel,
      contents: prompt,
      config: baseConfig(temperature),
    });
    const text = response.text?.trim();
    if (text === undefined || text === "") {
      throw new Error("Empty model response");
    }
    return text;
  }

  /** Structured generation: JSON response mode, zod-validated, one retry. */
  async function generateJson<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
    const attempt = async (): Promise<T> => {
      const response = await models.generateContent({
        model: env.geminiModel,
        contents: prompt,
        config: {
          ...baseConfig(0.2),
          responseMimeType: "application/json",
          responseJsonSchema: z.toJSONSchema(schema),
        },
      });
      return parseModelJson(schema, response.text);
    };
    try {
      return await attempt();
    } catch (error) {
      logger.warn("Gemini JSON output failed validation; retrying once", {
        reason: error instanceof Error ? error.message : "unknown",
      });
      return attempt();
    }
  }

  async function* streamChat(request: ChatStreamRequest): AsyncGenerator<string, void, undefined> {
    try {
      const userText = [
        ...(request.searchContext === undefined
          ? []
          : [searchResultsContext(request.searchContext)]),
        wrapUntrusted("FAN MESSAGE", request.message),
      ].join("\n\n");
      const contents = [
        ...request.history.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
        { role: "user", parts: [{ text: userText }] },
      ];
      const stream = await models.generateContentStream({
        model: env.geminiModel,
        contents,
        config: {
          ...baseConfig(0.4),
          systemInstruction: assistantSystemPrompt(kbAsContext(), request.language),
        },
      });
      for await (const chunk of stream) {
        if (chunk.text !== undefined && chunk.text !== "") {
          yield chunk.text;
        }
      }
    } catch (error) {
      logger.error("Gemini chat stream failed; serving mock answer", {
        reason: error instanceof Error ? error.message : "unknown",
      });
      yield* fallback.streamChat(request);
    }
  }

  /** Runs a live call and degrades to the mock twin on any failure. */
  async function withFallback<T>(
    operation: string,
    live: () => Promise<T>,
    mock: () => Promise<T>,
  ): Promise<T> {
    try {
      return await live();
    } catch (error) {
      logger.error(`Gemini ${operation} failed; serving mock fallback`, {
        reason: error instanceof Error ? error.message : "unknown",
      });
      return mock();
    }
  }

  return {
    mocked: false,
    streamChat,
    narrateRoute: (route, language) =>
      withFallback(
        "route narration",
        () => generateText(routeNarrationPrompt(route, describeRoute(route), language), 0.3),
        () => fallback.narrateRoute(route, language),
      ),
    recommendCrowdActions: (snapshot) =>
      withFallback(
        "crowd recommendation",
        () => generateJson(crowdRecommendationSchema, crowdRecommendationPrompt(snapshot)),
        () => fallback.recommendCrowdActions(snapshot),
      ),
    generateBriefing: (incidents, snapshot) =>
      withFallback(
        "briefing",
        () => generateJson(briefingSchema, briefingPrompt(incidents, snapshot)),
        () => fallback.generateBriefing(incidents, snapshot),
      ),
    simplifyText: (request) =>
      withFallback(
        "simplify",
        () =>
          generateText(simplifyPrompt(request.text, request.readingLevel, request.language), 0.3),
        () => fallback.simplifyText(request),
      ),
    sustainabilityTip: (comparison, mode) =>
      withFallback(
        "sustainability tip",
        () => {
          const lines = comparison
            .map((entry) => `${entry.label}: ${String(entry.gramsCo2e)} g CO2e`)
            .join("\n");
          return generateText(sustainabilityTipPrompt(`Chosen mode: ${mode}\n${lines}`), 0.6);
        },
        () => fallback.sustainabilityTip(comparison, mode),
      ),
    transitAdvice: (plan, kickoffIso, leaveByIso) =>
      withFallback(
        "transit advice",
        () => generateText(transitAdvicePrompt(plan, kickoffIso, leaveByIso), 0.3),
        () => fallback.transitAdvice(plan, kickoffIso, leaveByIso),
      ),
  };
}

let cachedService: GeminiService | undefined;

/** Returns the process-wide Gemini service: live when a key exists, mock otherwise. */
export function getGeminiService(): GeminiService {
  if (cachedService === undefined) {
    if (isServiceMocked(env, "gemini")) {
      cachedService = createMockGeminiService();
    } else {
      const client = new GoogleGenAI({ apiKey: env.geminiApiKey });
      cachedService = createRealGeminiService(client.models);
    }
  }
  return cachedService;
}
