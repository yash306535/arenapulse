/**
 * Client-side reader for the /api/chat Server-Sent Events stream. Parses the
 * meta/token/done/error frames emitted by the route and invokes handlers so
 * the assistant UI can render tokens as they arrive.
 */
import type { ChatTurn } from "@/schemas/chat";
import type { Language } from "@/schemas/common";
import type { SearchResult } from "@/schemas/search";

/** Callbacks invoked as the stream is consumed. */
export interface ChatStreamHandlers {
  readonly onMeta: (meta: { mocked: boolean; sources: SearchResult[] }) => void;
  readonly onToken: (text: string) => void;
}

/** The chat request body sent to the streaming route. */
export interface ChatStreamInput {
  readonly message: string;
  readonly history: ChatTurn[];
  readonly language?: Language;
}

function parseFrame(frame: string): { event: string; data: unknown } | null {
  const eventLine = frame.split("\n").find((line) => line.startsWith("event: "));
  const dataLine = frame.split("\n").find((line) => line.startsWith("data: "));
  if (eventLine === undefined || dataLine === undefined) {
    return null;
  }
  return {
    event: eventLine.slice("event: ".length),
    data: JSON.parse(dataLine.slice("data: ".length)) as unknown,
  };
}

function dispatch(frame: string, handlers: ChatStreamHandlers): void {
  const parsed = parseFrame(frame);
  if (parsed === null) {
    return;
  }
  if (parsed.event === "meta") {
    handlers.onMeta(parsed.data as { mocked: boolean; sources: SearchResult[] });
  } else if (parsed.event === "token") {
    handlers.onToken((parsed.data as { text: string }).text);
  }
}

/**
 * POSTs a chat request and streams the reply, invoking `handlers` per frame.
 * Throws on a non-OK response or missing body so callers can show an error.
 */
export async function streamAssistant(
  input: ChatStreamInput,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok || response.body === null) {
    throw new Error("Chat request failed");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      dispatch(frame, handlers);
    }
  }
}
