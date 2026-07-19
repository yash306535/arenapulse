/**
 * F1 — Multilingual Match-Day Assistant. POST streams a Gemini answer back to
 * the client as Server-Sent Events; requests are rate-limited and strictly
 * validated. All AI/search work runs server-side (keys never reach the client).
 */
import { buildChatStream } from "@/lib/ai/chat-stream";
import { enforceRateLimit, readJsonBody, toErrorResponse } from "@/lib/http/api";
import { aiRateLimiter } from "@/lib/security/rate-limit";
import { chatRequestSchema } from "@/schemas/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Streams a multilingual assistant reply as `text/event-stream`. */
export async function POST(request: Request): Promise<Response> {
  try {
    enforceRateLimit(request, aiRateLimiter);
    const body = await readJsonBody(request, chatRequestSchema);
    const stream = await buildChatStream(body);
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store, no-transform",
        connection: "keep-alive",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
