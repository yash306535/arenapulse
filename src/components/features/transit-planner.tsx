/**
 * F5 — Transit & Parking Planner UI (transportation). Plans a journey to the
 * venue via /api/transit and shows step-by-step directions, a smart leave-by
 * time, and a static map proxied through our own origin (no client-side Google
 * key).
 */
"use client";

import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/i18n/app-context";
import type { TransitPlan, TravelMode } from "@/schemas/transit";

/** A selectable match fixture. */
export interface MatchOption {
  readonly id: string;
  readonly label: string;
}

interface TransitResult {
  readonly plan: TransitPlan;
  readonly advice: string;
  readonly leaveByIso: string;
  readonly arriveByIso: string;
  readonly mocked: boolean;
}

export function TransitPlanner({
  matches,
}: {
  readonly matches: MatchOption[];
}): React.JSX.Element {
  const { t } = useAppContext();
  const [matchId, setMatchId] = useState(matches[0]?.id ?? "");
  const [origin, setOrigin] = useState("");
  const [mode, setMode] = useState<TravelMode>("transit");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [result, setResult] = useState<TransitResult | null>(null);

  const submit = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    if (origin.trim().length < 2) {
      return;
    }
    setStatus("loading");
    setResult(null);
    try {
      const response = await fetch("/api/transit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ matchId, origin, mode }),
      });
      if (!response.ok) {
        throw new Error("request failed");
      }
      setResult((await response.json()) as TransitResult);
      setStatus("ok");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t.transit.heading} description={t.transit.description}>
        {result !== null ? <DemoBadge mocked={result.mocked} label={t.common.demoMode} /> : null}
      </PageHeader>

      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="grid gap-4 sm:grid-cols-3"
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t.transit.match}
          <select
            value={matchId}
            onChange={(event) => {
              setMatchId(event.target.value);
            }}
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            {matches.map((match) => (
              <option key={match.id} value={match.id}>
                {match.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t.transit.origin}
          <input
            value={origin}
            onChange={(event) => {
              setOrigin(event.target.value);
            }}
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t.transit.mode}
          <select
            value={mode}
            onChange={(event) => {
              setMode(event.target.value as TravelMode);
            }}
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            <option value="transit">{t.transit.modeTransit}</option>
            <option value="drive">{t.transit.modeDrive}</option>
            <option value="walk">{t.transit.modeWalk}</option>
          </select>
        </label>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={status === "loading" || origin.trim().length < 2}>
            {status === "loading" ? t.common.loading : t.transit.plan}
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
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">{t.transit.planHeading}</h2>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              {t.transit.leaveBy} {result.leaveByIso.slice(11, 16)} · {t.transit.arriveBy}{" "}
              {result.arriveByIso.slice(11, 16)}
            </p>
            <p className="text-sm">{result.advice}</p>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              {result.plan.steps.map((step, index) => (
                <li key={index}>
                  {step.instruction} ({step.durationMinutes} min)
                </li>
              ))}
            </ol>
          </Card>
          {/* Image proxied through our own /api/map-image route — key stays server-side. */}
          <img
            src="/api/map-image?width=600&height=400&zoom=14"
            alt={t.transit.mapAlt}
            className="h-auto w-full rounded-lg border border-slate-200 dark:border-slate-700"
          />
        </div>
      ) : null}
    </div>
  );
}
