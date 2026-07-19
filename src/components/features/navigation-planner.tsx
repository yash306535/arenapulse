/**
 * F2 — Smart Stadium Navigation UI. Picks an origin/destination, optionally
 * restricts to step-free routes (F4 accessibility), calls /api/navigation, and
 * renders the highlighted map alongside a keyboard-accessible step list — the
 * map's equivalent non-visual UI — plus Gemini's natural-language narration.
 */
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { MapEdge, MapNode } from "./route-map";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppContext } from "@/i18n/app-context";
import type { RouteResult } from "@/schemas/navigation";

const RouteMap = dynamic(() => import("./route-map").then((mod) => mod.RouteMap), {
  ssr: false,
});

/** A selectable stadium node. */
export interface NodeOption {
  readonly id: string;
  readonly label: string;
}

interface Result {
  readonly route: RouteResult;
  readonly narration: string;
  readonly mocked: boolean;
}

export function NavigationPlanner({
  nodeOptions,
  mapNodes,
  mapEdges,
  viewBox,
}: {
  readonly nodeOptions: NodeOption[];
  readonly mapNodes: MapNode[];
  readonly mapEdges: MapEdge[];
  readonly viewBox: string;
}): React.JSX.Element {
  const { t, uiLanguage } = useAppContext();
  const [originId, setOriginId] = useState(nodeOptions[0]?.id ?? "");
  const [destinationId, setDestinationId] = useState(nodeOptions.at(-1)?.id ?? "");
  const [stepFree, setStepFree] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "noroute" | "error">("idle");
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    setStatus("loading");
    setResult(null);
    try {
      const response = await fetch("/api/navigation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originId,
          destinationId,
          stepFreeOnly: stepFree,
          language: uiLanguage,
        }),
      });
      if (response.status === 422) {
        setStatus("noroute");
        return;
      }
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
      <PageHeader title={t.navigation.heading} description={t.navigation.description}>
        {result !== null ? <DemoBadge mocked={result.mocked} label={t.common.demoMode} /> : null}
      </PageHeader>

      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t.navigation.origin}
          <select
            value={originId}
            onChange={(event) => {
              setOriginId(event.target.value);
            }}
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            {nodeOptions.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t.navigation.destination}
          <select
            value={destinationId}
            onChange={(event) => {
              setDestinationId(event.target.value);
            }}
            className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
          >
            {nodeOptions.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium sm:col-span-2">
          <input
            type="checkbox"
            checked={stepFree}
            onChange={(event) => {
              setStepFree(event.target.checked);
            }}
            className="h-5 w-5"
          />
          {t.navigation.stepFree}
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={status === "loading"}>
            {status === "loading" ? t.common.loading : t.navigation.getDirections}
          </Button>
        </div>
      </form>

      {status === "loading" ? <Skeleton className="h-64" label={t.common.loading} /> : null}
      {status === "noroute" ? (
        <p role="alert" className="text-sm text-red-700">
          {t.navigation.noRoute}
        </p>
      ) : null}
      {status === "error" ? (
        <p role="alert" className="text-sm text-red-700">
          {t.common.error}
        </p>
      ) : null}

      {status === "ok" && result !== null ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <RouteMap
            viewBox={viewBox}
            nodes={mapNodes}
            edges={mapEdges}
            pathNodeIds={result.route.nodeIds}
            title={t.navigation.routeHeading}
          />
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{t.navigation.routeHeading}</h2>
              <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                {result.narration}
              </p>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">{t.navigation.stepsHeading}</h3>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {result.route.steps.map((step) => (
                  <li key={`${step.fromId}-${step.toId}`}>
                    {step.fromLabel} → {step.toLabel} ({step.distanceMeters} m, {step.via})
                  </li>
                ))}
              </ol>
              <p className="mt-2 text-sm font-medium">
                {t.navigation.totalDistance}: {result.route.totalDistanceMeters} m
              </p>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
