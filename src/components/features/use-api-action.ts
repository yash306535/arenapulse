/**
 * Small client hook standardizing the "submit a request, then render its
 * result" flow used across feature forms: it tracks status, exposes the typed
 * result, and centralizes error handling so each component stays declarative.
 */
"use client";

import { useCallback, useState } from "react";

/** Lifecycle status of an async action. */
export type ActionStatus = "idle" | "loading" | "success" | "error";

/** The state and trigger returned by {@link useApiAction}. */
export interface ApiAction<T> {
  readonly status: ActionStatus;
  readonly result: T | null;
  /** Runs `task`, moving through loading → success/error and storing the result. */
  readonly run: (task: () => Promise<T>) => Promise<void>;
}

/**
 * Manages the status/result of a one-shot async task (typically a `fetch`).
 * The caller supplies the task on each `run`, keeping request wiring local
 * while the loading/error bookkeeping is shared.
 */
export function useApiAction<T>(): ApiAction<T> {
  const [status, setStatus] = useState<ActionStatus>("idle");
  const [result, setResult] = useState<T | null>(null);

  const run = useCallback(async (task: () => Promise<T>): Promise<void> => {
    setStatus("loading");
    setResult(null);
    try {
      setResult(await task());
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }, []);

  return { status, result, run };
}

/** Parses a JSON API response, throwing on a non-OK status. */
export async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`Request to ${input} failed with ${String(response.status)}`);
  }
  return (await response.json()) as T;
}

/** Builds the `RequestInit` for a JSON POST. */
export function postJson(body: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}
