import { describe, expect, it, vi } from "vitest";

import { postJson, requestJson, useApiAction } from "./use-api-action";

import { act, renderHook, waitFor } from "@/test/render";

describe("postJson", () => {
  it("builds a JSON POST init", () => {
    const init = postJson({ a: 1 });
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ "content-type": "application/json" });
    expect(init.body).toBe('{"a":1}');
  });
});

describe("requestJson", () => {
  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({ ok: true })))),
    );
    await expect(requestJson<{ ok: boolean }>("/x")).resolves.toEqual({ ok: true });
    vi.unstubAllGlobals();
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response("no", { status: 500 }))),
    );
    await expect(requestJson("/x")).rejects.toThrow(/500/);
    vi.unstubAllGlobals();
  });
});

describe("useApiAction", () => {
  it("transitions idle → loading → success and stores the result", async () => {
    const { result } = renderHook(() => useApiAction<number>());
    expect(result.current.status).toBe("idle");
    await act(async () => {
      await result.current.run(() => Promise.resolve(42));
    });
    expect(result.current.status).toBe("success");
    expect(result.current.result).toBe(42);
  });

  it("moves to error when the task rejects", async () => {
    const { result } = renderHook(() => useApiAction<number>());
    await act(async () => {
      await result.current.run(() => Promise.reject(new Error("nope")));
    });
    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });
    expect(result.current.result).toBeNull();
  });
});
