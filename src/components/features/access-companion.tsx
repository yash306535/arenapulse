/**
 * F4 — Accessibility Companion UI (accessibility). Lists accessible services
 * (step-free seating, sensory rooms, assistive-listening pickup) and offers a
 * plain-language mode that rewrites any announcement via /api/simplify at a
 * chosen reading level.
 */
"use client";

import { useState } from "react";

import { useApiAction, postJson, requestJson } from "./use-api-action";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { LabeledSelect, LabeledTextarea } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/i18n/app-context";
import { MAX_SIMPLIFY_TEXT_LENGTH } from "@/lib/constants";
import type { ReadingLevel } from "@/schemas/simplify";

/** An accessibility service location. */
export interface AccessService {
  readonly id: string;
  readonly label: string;
}

interface SimplifyResult {
  readonly text: string;
  readonly mocked: boolean;
}

const MIN_TEXT_LENGTH = 5;

export function AccessCompanion({
  services,
}: {
  readonly services: AccessService[];
}): React.JSX.Element {
  const { t, uiLanguage } = useAppContext();
  const [text, setText] = useState("");
  const [readingLevel, setReadingLevel] = useState<ReadingLevel>("simple");
  const { status, result, run } = useApiAction<SimplifyResult>();

  const submit = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    if (text.trim().length < MIN_TEXT_LENGTH) {
      return;
    }
    void run(() =>
      requestJson<SimplifyResult>(
        "/api/simplify",
        postJson({ text, readingLevel, language: uiLanguage }),
      ),
    );
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
        <form onSubmit={submit} className="space-y-3" aria-label={t.access.simplifyHeading}>
          <LabeledTextarea
            label={t.access.announcementLabel}
            value={text}
            onValueChange={setText}
            maxLength={MAX_SIMPLIFY_TEXT_LENGTH}
          />
          <LabeledSelect
            label={t.access.readingLevel}
            value={readingLevel}
            onValueChange={setReadingLevel}
            options={[
              { value: "simple", label: t.access.simple },
              { value: "very-simple", label: t.access.verySimple },
            ]}
          />
          <Button
            type="submit"
            disabled={status === "loading" || text.trim().length < MIN_TEXT_LENGTH}
          >
            {status === "loading" ? t.common.loading : t.access.simplify}
          </Button>
        </form>

        {status === "loading" ? <Skeleton className="h-20" label={t.common.loading} /> : null}
        {status === "error" ? (
          <p role="alert" className="text-sm text-red-700">
            {t.common.error}
          </p>
        ) : null}
        {status === "success" && result !== null ? (
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
