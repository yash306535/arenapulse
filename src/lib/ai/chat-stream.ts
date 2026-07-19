/**
 * Orchestrates a streamed assistant turn (F1) as a Server-Sent Events stream.
 * Keeps the /api/chat route handler thin: decides whether the question needs
 * grounded live search (F8), attaches cited results as clearly-labeled
 * untrusted context, then relays Gemini tokens as SSE events. The Gemini
 * service degrades to its mock twin internally, so this never rejects mid-stream.
 */
import { getGeminiService } from "./gemini";
import { isLiveInfoQuery } from "./live-info";

import { getSearchService } from "@/lib/google/search";
import { logger } from "@/lib/logger";
import type { ChatRequest } from "@/schemas/chat";
import type { SearchResponse, SearchResult } from "@/schemas/search";

/** Formats cited search results as compact text for the model prompt. */
function formatSearchContext(response: SearchResponse): string {
  return response.results
    .map(
      (result, index) =>
        `${String(index + 1)}. ${result.title} — ${result.snippet} (source: ${result.source})`,
    )
    .join("\n");
}

/** Encodes one SSE event frame. */
function frame(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * Builds the SSE response stream for a chat request. Emits a `meta` event
 * (mock flag + any cited sources), a `token` event per streamed chunk, and a
 * terminal `done` event.
 */
export async function buildChatStream(request: ChatRequest): Promise<ReadableStream<Uint8Array>> {
  const gemini = getGeminiService();
  let sources: SearchResult[] = [];
  let searchContext: string | undefined;

  if (isLiveInfoQuery(request.message)) {
    const response = await getSearchService().search(request.message);
    sources = response.results;
    searchContext = formatSearchContext(response);
  }

  const tokens = gemini.streamChat({
    message: request.message,
    history: request.history,
    language: request.language,
    searchContext,
  });

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown): void => {
        controller.enqueue(encoder.encode(frame(event, data)));
      };
      try {
        send("meta", { mocked: gemini.mocked, sources });
        for await (const token of tokens) {
          send("token", { text: token });
        }
        send("done", {});
      } catch (error) {
        logger.error("Chat stream terminated early", {
          reason: error instanceof Error ? error.message : "unknown",
        });
        send("error", { message: "The assistant is unavailable right now." });
      } finally {
        controller.close();
      }
    },
  });
}
