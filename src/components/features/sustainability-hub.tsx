/**
 * F6 — Sustainability Hub UI (sustainability). Compares travel-mode carbon
 * impact via /api/sustainability and shows a personalized Gemini tip. Emission
 * factors are illustrative (disclosed in the returned note).
 */
"use client";

import { useState } from "react";

import { useApiAction, postJson, requestJson } from "./use-api-action";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { LabeledInput, LabeledSelect } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/i18n/app-context";
import type { ModeComparison } from "@/lib/sustainability/carbon";
import { MAX_TRIP_DISTANCE_KM, type CarbonMode } from "@/schemas/sustainability";

/** A selectable travel mode. */
export interface ModeOption {
  readonly mode: CarbonMode;
  readonly label: string;
}

interface Result {
  readonly comparison: ModeComparison[];
  readonly tip: string;
  readonly note: string;
  readonly mocked: boolean;
}

const DEFAULT_DISTANCE_KM = "8";

export function SustainabilityHub({ modes }: { readonly modes: ModeOption[] }): React.JSX.Element {
  const { t } = useAppContext();
  const [mode, setMode] = useState<CarbonMode>(modes[0]?.mode ?? "car");
  const [distanceKm, setDistanceKm] = useState(DEFAULT_DISTANCE_KM);
  const { status, result, run } = useApiAction<Result>();

  const submit = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    const distance = Number(distanceKm);
    if (!Number.isFinite(distance) || distance <= 0) {
      return;
    }
    void run(() =>
      requestJson<Result>("/api/sustainability", postJson({ mode, distanceKm: distance })),
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t.sustainability.heading} description={t.sustainability.description}>
        {result !== null ? <DemoBadge mocked={result.mocked} label={t.common.demoMode} /> : null}
      </PageHeader>

      <form
        onSubmit={submit}
        className="grid items-end gap-4 sm:grid-cols-3"
        aria-label={t.sustainability.heading}
      >
        <LabeledSelect
          label={t.sustainability.mode}
          value={mode}
          onValueChange={setMode}
          options={modes.map((option) => ({ value: option.mode, label: option.label }))}
        />
        <LabeledInput
          label={t.sustainability.distance}
          type="number"
          min={1}
          max={MAX_TRIP_DISTANCE_KM}
          value={distanceKm}
          onValueChange={setDistanceKm}
        />
        <Button type="submit" disabled={status === "loading"}>
          {status === "loading" ? t.common.loading : t.sustainability.compare}
        </Button>
      </form>

      {status === "loading" ? <Skeleton className="h-40" label={t.common.loading} /> : null}
      {status === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {t.common.error}
        </p>
      ) : null}

      {status === "success" && result !== null ? (
        <div className="space-y-4" aria-live="polite">
          <Card>
            <h2 className="mb-2 text-lg font-semibold">{t.sustainability.comparisonHeading}</h2>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th scope="col" className="py-1">
                    {t.sustainability.mode}
                  </th>
                  <th scope="col" className="py-1">
                    g CO₂e
                  </th>
                  <th scope="col" className="py-1">
                    {t.sustainability.savedVsCar}
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.comparison.map((entry) => (
                  <tr key={entry.mode} className="border-b border-slate-100 dark:border-slate-800">
                    <th scope="row" className="py-1 font-normal">
                      {entry.label}
                    </th>
                    <td className="py-1">{entry.gramsCo2e}</td>
                    <td className="py-1">{entry.savedVsCarGrams}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-slate-500">{result.note}</p>
          </Card>
          <Card>
            <h2 className="mb-1 text-lg font-semibold">{t.sustainability.tipHeading}</h2>
            <p className="text-sm">{result.tip}</p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
