import { afterEach, describe, expect, it, vi } from "vitest";

import { AssistantChat } from "./assistant-chat";

import { renderWithProviders, screen, userEvent, waitFor } from "@/test/render";

function sseResponse(frames: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const frame of frames) {
        controller.enqueue(encoder.encode(frame));
      }
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/event-stream" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AssistantChat", () => {
  it("sends a message and renders the streamed answer with sources", async () => {
    const fetchMock = vi.fn((_url: string | URL, _init?: RequestInit) =>
      Promise.resolve(
        sseResponse([
          'event: meta\ndata: {"mocked":true,"sources":[{"title":"Schedule","snippet":"s","url":"https://example.org/a","source":"example.org"}]}\n\n',
          'event: token\ndata: {"text":"Gate A "}\n\n',
          'event: token\ndata: {"text":"opens early."}\n\n',
          "event: done\ndata: {}\n\n",
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<AssistantChat />);
    await user.type(screen.getByLabelText("Your question"), "When does Gate A open?");
    await user.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => {
      expect(screen.getByText(/Gate A opens early\./)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: "Schedule" })).toHaveAttribute(
      "href",
      "https://example.org/a",
    );
    const body = JSON.parse((fetchMock.mock.calls[0]?.[1]?.body ?? "{}") as string) as {
      message: string;
    };
    expect(body.message).toBe("When does Gate A open?");
  });

  it("toggles an answer-language chip via aria-pressed", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AssistantChat />);
    const chip = screen.getByRole("button", { name: "ES" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });
});
