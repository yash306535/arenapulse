/**
 * F5 — Transit & Parking Planner UI (transportation). Plans a journey to the
 * venue via /api/transit and shows step-by-step directions, a smart leave-by
 * time, and a static map proxied through our own origin (no client-side Google
 * key).
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

const MAP_IMAGE_SRC = "/api/map-image?width=600&height=400&zoom=14";
const MIN_ORIGIN_LENGTH = 2;
/** ISO 8601 index range for the local `HH:MM` substring. */
const TIME_START = 11;
const TIME_END = 16;

export function TransitPlanner({
  matches,
}: {
  readonly matches: MatchOption[];
}): React.JSX.Element {
  const { t } = useAppContext();
  const [matchId, setMatchId] = useState(matches[0]?.id ?? "");
  const [origin, setOrigin] = useState("");
  const [mode, setMode] = useState<TravelMode>("transit");
  const { status, result, run } = useApiAction<TransitResult>();

  const submit = (event: React.SyntheticEvent): void => {
    event.preventDefault();
    if (origin.trim().length < MIN_ORIGIN_LENGTH) {
      return;
    }
    void run(() => requestJson<TransitResult>("/api/transit", postJson({ matchId, origin, mode })));
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t.transit.heading} description={t.transit.description}>
        {result === null ? null : <DemoBadge mocked={result.mocked} label={t.common.demoMode} />}
      </PageHeader>

      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3" aria-label={t.transit.heading}>
        <LabeledSelect
          label={t.transit.match}
          value={matchId}
          onValueChange={setMatchId}
          options={matches.map((match) => ({ value: match.id, label: match.label }))}
        />
        <LabeledInput label={t.transit.origin} value={origin} onValueChange={setOrigin} />
        <LabeledSelect
          label={t.transit.mode}
          value={mode}
          onValueChange={setMode}
          options={[
            { value: "transit", label: t.transit.modeTransit },
            { value: "drive", label: t.transit.modeDrive },
            { value: "walk", label: t.transit.modeWalk },
          ]}
        />
        <div className="sm:col-span-3">
          <Button
            type="submit"
            disabled={status === "loading" || origin.trim().length < MIN_ORIGIN_LENGTH}
          >
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

      {status === "success" && result !== null ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="text-lg font-semibold">{t.transit.planHeading}</h2>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              {t.transit.leaveBy} {result.leaveByIso.slice(TIME_START, TIME_END)} ·{" "}
              {t.transit.arriveBy} {result.arriveByIso.slice(TIME_START, TIME_END)}
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
            src={MAP_IMAGE_SRC}
            alt={t.transit.mapAlt}
            className="h-auto w-full rounded-lg border border-slate-200 dark:border-slate-700"
          />
        </div>
      ) : null}
    </div>
  );
}
