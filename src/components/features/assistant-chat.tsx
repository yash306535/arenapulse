/**
 * F1 — Multilingual Match-Day Assistant UI. Streams answers from /api/chat,
 * renders them as sanitized markdown (no raw HTML), announces streamed text via
 * an aria-live region, and offers quick language chips. Cited live-info sources
 * (F8) and a demo-mode badge are shown when present.
 */
"use client";

import { useRef, useState } from "react";
import Markdown from "react-markdown";

import { streamAssistant } from "./chat-sse";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { useAppContext } from "@/i18n/app-context";
import { MAX_CHAT_HISTORY_TURNS, MAX_CHAT_MESSAGE_LENGTH } from "@/lib/constants";
import type { ChatTurn } from "@/schemas/chat";
import { LANGUAGES, type Language } from "@/schemas/common";
import type { SearchResult } from "@/schemas/search";

interface Message {
  readonly role: "user" | "model";
  readonly text: string;
}

export function AssistantChat(): React.JSX.Element {
  const { t } = useAppContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<Language | undefined>(undefined);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState(false);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [mocked, setMocked] = useState(false);
  const appendRef = useRef<(text: string) => void>(() => undefined);

  const submit = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    const message = input.trim();
    if (message === "" || streaming) {
      return;
    }
    const history: ChatTurn[] = messages.slice(-MAX_CHAT_HISTORY_TURNS);
    setMessages((prev) => [...prev, { role: "user", text: message }, { role: "model", text: "" }]);
    setInput("");
    setError(false);
    setSources([]);
    setStreaming(true);
    appendRef.current = (chunk: string): void => {
      setMessages((prev) => {
        const next = [...prev];
        const last = next.at(-1);
        if (last !== undefined) {
          next[next.length - 1] = { role: "model", text: last.text + chunk };
        }
        return next;
      });
    };
    try {
      await streamAssistant(
        { message, history, language },
        {
          onMeta: (meta) => {
            setMocked(meta.mocked);
            setSources(meta.sources);
          },
          onToken: (text) => {
            appendRef.current(text);
          },
        },
      );
    } catch {
      setError(true);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t.assistant.heading} description={t.assistant.description}>
        <DemoBadge mocked={mocked} label={t.common.demoMode} />
      </PageHeader>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t.assistant.languageChips}</legend>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={language === code}
              onClick={() => {
                setLanguage((current) => (current === code ? undefined : code));
              }}
              className={`min-h-11 rounded-full border px-3 py-1 text-sm font-medium ${
                language === code
                  ? "border-emerald-700 bg-emerald-700 text-white"
                  : "border-slate-300 bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100"
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>
      </fieldset>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">{t.assistant.conversation}</h2>
        <div aria-live="polite" className="space-y-4">
          {messages.length === 0 ? (
            <p className="text-slate-500">{t.assistant.emptyState}</p>
          ) : (
            messages.map((message, index) => (
              <div key={index} className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">
                  {message.role === "user" ? t.assistant.you : t.assistant.assistantName}
                </p>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Markdown>{message.text}</Markdown>
                </div>
              </div>
            ))
          )}
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-red-700">
            {t.common.error}
          </p>
        ) : null}
        {sources.length > 0 ? (
          <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-700">
            <h3 className="text-sm font-semibold">{t.common.sources}</h3>
            <ul className="mt-1 space-y-1 text-sm">
              {sources.map((source) => (
                <li key={source.url}>
                  <a
                    href={source.url}
                    className="text-emerald-800 underline dark:text-emerald-300"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source.title}
                  </a>{" "}
                  <span className="text-slate-500">— {source.source}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <label htmlFor="assistant-input" className="sr-only">
          {t.assistant.inputLabel}
        </label>
        <input
          id="assistant-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
          }}
          placeholder={t.assistant.placeholder}
          maxLength={MAX_CHAT_MESSAGE_LENGTH}
          className="min-h-11 flex-1 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        />
        <Button type="submit" disabled={streaming || input.trim() === ""}>
          {streaming ? t.common.loading : t.common.send}
        </Button>
      </form>
    </div>
  );
}
