/**
 * F2 — Smart Stadium Navigation UI (navigation). Picks an origin/destination,
 * optionally restricts to step-free routes (F4 accessibility), calls
 * /api/navigation, and renders the highlighted map alongside a
 * keyboard-accessible step list — the map's equivalent non-visual UI — plus
 * Gemini's natural-language narration.
 */
"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import type { MapEdge, MapNode } from "./route-map";
import { postJson } from "./use-api-action";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { LabeledCheckbox, LabeledSelect } from "@/components/ui/field";
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

type Status = "idle" | "loading" | "success" | "noroute" | "error";

/** HTTP status returned when no route exists under the given constraints. */
const NO_ROUTE_STATUS = 422;

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
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    setStatus("loading");
    setResult(null);
    try {
      const response = await fetch(
        "/api/navigation",
        postJson({ originId, destinationId, stepFreeOnly: stepFree, language: uiLanguage }),
      );
      if (response.status === NO_ROUTE_STATUS) {
        setStatus("noroute");
        return;
      }
      if (!response.ok) {
        throw new Error("request failed");
      }
      setResult((await response.json()) as Result);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const options = nodeOptions.map((node) => ({ value: node.id, label: node.label }));

  return (
    <div className="space-y-4">
      <PageHeader title={t.navigation.heading} description={t.navigation.description}>
        {result === null ? null : <DemoBadge mocked={result.mocked} label={t.common.demoMode} />}
      </PageHeader>

      <form
        onSubmit={(event) => {
          void submit(event);
        }}
        className="grid gap-4 sm:grid-cols-2"
        aria-label={t.navigation.heading}
      >
        <LabeledSelect
          label={t.navigation.origin}
          value={originId}
          onValueChange={setOriginId}
          options={options}
        />
        <LabeledSelect
          label={t.navigation.destination}
          value={destinationId}
          onValueChange={setDestinationId}
          options={options}
        />
        <LabeledCheckbox
          label={t.navigation.stepFree}
          checked={stepFree}
          onCheckedChange={setStepFree}
          className="sm:col-span-2"
        />
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

      {status === "success" && result !== null ? (
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
