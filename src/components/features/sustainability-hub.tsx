/**
 * F6 — Sustainability Hub UI. Compares travel-mode carbon impact via
 * /api/sustainability and shows a personalized Gemini tip. Emission factors are
 * illustrative (disclosed in the returned note).
 */
"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/i18n/app-context";
import type { ModeComparison } from "@/lib/sustainability/carbon";
import type { CarbonMode } from "@/schemas/sustainability";

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

export function SustainabilityHub({ modes }: { readonly modes: ModeOption[] }): React.JSX.Element {
  const { t } = useAppContext();
  const [mode, setMode] = useState<CarbonMode>(modes[0]?.mode ?? "car");
  const [distanceKm, setDistanceKm] = useState("8");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    const distance = Number(distanceKm);
    if (!Number.isFinite(distance) || distance <= 0) {
      return;
    }
    setStatus("loading");
    setResult(null);
    try {
      const response = await fetch("/api/sustainability", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, distanceKm: distance }),
      });
      if (!response.ok) {
        throw new Error("request failed");
      }
      setResult((await response.json()) as Result);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t.sustainability.heading} description={t.sustainability.description}>
        {result !== null ? <DemoBadge mocked={result.mocked} label={t.common.demoMode} /> : null}
      </PageHeader>

      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t.sustainability.mode}
          <select
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as CarbonMode);
            }}
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            {modes.map((option) => (
              <option key={option.mode} value={option.mode}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t.sustainability.distance}
          <input
            type="number"
            min="1"
            max="500"
            value={distanceKm}
            onChange={(event) => {
              setDistanceKm(event.target.value);
            }}
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        <div className="flex items-end">
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? t.common.loading : t.sustainability.compare}
          </Button>
        </div>
      </form>

      {status === "loading" ? <Skeleton className="h-40" label={t.common.loading} /> : null}
      {status === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {t.common.error}
        </p>
      ) : null}

      {status === "ok" && result !== null ? (
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
