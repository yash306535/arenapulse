/**
 * F4 — Accessibility Companion plain-language mode. POST rewrites an
 * announcement into plain language at the requested reading level and
 * language via Gemini. Input length is bounded by the schema. AI-limited.
 */
import { getGeminiService } from "@/lib/ai/gemini";
import { enforceRateLimit, jsonResponse, readJsonBody, toErrorResponse } from "@/lib/http/api";
import { aiRateLimiter } from "@/lib/security/rate-limit";
import { simplifyRequestSchema } from "@/schemas/simplify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Returns a plain-language rewrite of the supplied announcement. */
export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, aiRateLimiter);
    const body = await readJsonBody(request, simplifyRequestSchema);
    const gemini = getGeminiService();
    const text = await gemini.simplifyText(body);
    return jsonResponse({ text, mocked: gemini.mocked });
  } catch (error) {
    return toErrorResponse(error);
  }
}
