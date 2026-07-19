/**
 * F4 — Accessibility Companion UI. Lists accessible services (step-free seating,
 * sensory rooms, assistive-listening pickup) and offers a plain-language mode
 * that rewrites any announcement via /api/simplify at a chosen reading level.
 */
"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/i18n/app-context";
import type { ReadingLevel } from "@/schemas/simplify";

/** An accessibility service location. */
export interface AccessService {
  readonly id: string;
  readonly label: string;
}

export function AccessCompanion({
  services,
}: {
  readonly services: AccessService[];
}): React.JSX.Element {
  const { t, uiLanguage } = useAppContext();
  const [text, setText] = useState("");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("simple");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [result, setResult] = useState<{ text: string; mocked: boolean } | null>(null);

  const submit = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    if (text.trim().length < 5) {
      return;
    }
    setStatus("loading");
    setResult(null);
    try {
      const response = await fetch("/api/simplify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, readingLevel, language: uiLanguage }),
      });
      if (!response.ok) {
        throw new Error("request failed");
      }
      setResult((await response.json()) as { text: string; mocked: boolean });
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t.access.heading} description={t.access.description} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.access.directoryHeading}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {services.map((service) => (
            <li key={service.id}>
              <Card className="p-3 text-sm">{service.label}</Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.access.simplifyHeading}</h2>
        <form
          onSubmit={(event) => {
            void submit(event);
          }}
          className="space-y-3"
        >
          <label htmlFor="announcement" className="block text-sm font-medium">
            {t.access.announcementLabel}
          </label>
          <textarea
            id="announcement"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
            }}
            rows={4}
            maxLength={4000}
            className="w-full rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
          <label htmlFor="reading-level" className="block text-sm font-medium">
            {t.access.readingLevel}
          </label>
          <select
            id="reading-level"
            value={readingLevel}
            onChange={(event) => {
              setReadingLevel(event.target.value as ReadingLevel);
            }}
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="simple">{t.access.simple}</option>
            <option value="very-simple">{t.access.verySimple}</option>
          </select>
          <Button type="submit" disabled={status === "loading" || text.trim().length < 5}>
            {status === "loading" ? t.common.loading : t.access.simplify}
          </Button>
        </form>

        {status === "loading" ? <Skeleton className="h-20" label={t.common.loading} /> : null}
        {status === "error" ? (
          <p role="alert" className="text-sm text-red-700">
            {t.common.error}
          </p>
        ) : null}
        {status === "ok" && result !== null ? (
          <Card className="space-y-2" aria-live="polite">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{t.access.resultHeading}</h3>
              <DemoBadge mocked={result.mocked} label={t.common.demoMode} />
            </div>
            <p className="whitespace-pre-line text-sm">{result.text}</p>
          </Card>
        ) : null}
      </section>
    </div>
  );
}
