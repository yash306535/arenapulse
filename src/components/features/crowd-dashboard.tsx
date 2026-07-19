/**
 * F3 — Crowd Intelligence & Heatmap UI (crowd management + real-time decision
 * support). Polls the simulated feed (pausing when the tab is hidden), renders
 * the heatmap and an accessible data table, and — for organizers — requests
 * Gemini decision-support recommendations rendered as cards. Always labeled
 * "simulated feed".
 */
"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { LevelBadge } from "@/components/ui/level-badge";
import { useAppContext } from "@/i18n/app-context";
import { CROWD_POLL_INTERVAL_MS } from "@/lib/constants";
import type { CrowdRecommendation, CrowdSnapshot, ZoneDensity } from "@/schemas/crowd";
import type { StadiumZone } from "@/schemas/stadium";

const CrowdHeatmap = dynamic(() => import("./crowd-heatmap").then((mod) => mod.CrowdHeatmap), {
  ssr: false,
});

function useCrowdPolling(): CrowdSnapshot | null {
  const [snapshot, setSnapshot] = useState<CrowdSnapshot | null>(null);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | undefined;
    const load = async (): Promise<void> => {
      try {
        const response = await fetch("/api/crowd");
        if (response.ok && active) {
          setSnapshot((await response.json()) as CrowdSnapshot);
        }
      } catch {
        /* transient poll failure is non-fatal; next tick retries */
      }
    };
    const start = (): void => {
      timer ??= setInterval(() => void load(), CROWD_POLL_INTERVAL_MS);
    };
    const stop = (): void => {
      if (timer !== undefined) {
        clearInterval(timer);
        timer = undefined;
      }
    };
    const onVisibility = (): void => {
      if (document.hidden) {
        stop();
      } else {
        void load();
        start();
      }
    };
    void load();
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  return snapshot;
}

export function CrowdDashboard({
  zones,
  viewBox,
}: {
  readonly zones: StadiumZone[];
  readonly viewBox: string;
}): React.JSX.Element {
  const { t, role } = useAppContext();
  const snapshot = useCrowdPolling();
  const [recommendation, setRecommendation] = useState<CrowdRecommendation | null>(null);
  const [recMocked, setRecMocked] = useState(false);
  const [loadingRec, setLoadingRec] = useState(false);

  const densityById: Record<string, ZoneDensity> = Object.fromEntries(
    (snapshot?.zones ?? []).map((zone) => [zone.zoneId, zone]),
  );

  const getRecommendations = async (): Promise<void> => {
    setLoadingRec(true);
    try {
      const response = await fetch("/api/crowd/recommend", { method: "POST" });
      if (response.ok) {
        const body = (await response.json()) as {
          recommendation: CrowdRecommendation;
          mocked: boolean;
        };
        setRecommendation(body.recommendation);
        setRecMocked(body.mocked);
      }
    } catch {
      /* handled by leaving prior state; button can be retried */
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t.crowd.heading} description={t.crowd.description}>
        <span className="rounded-full border border-amber-500 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {t.common.simulatedFeed}
        </span>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-2">
        <CrowdHeatmap
          viewBox={viewBox}
          zones={zones}
          densityById={densityById}
          title={t.crowd.heading}
        />
        <Card>
          <table className="w-full text-left text-sm">
            <caption className="mb-2 text-left text-xs text-slate-500">
              {snapshot === null
                ? t.common.loading
                : `${t.crowd.updated}: ${snapshot.generatedAtIso.slice(11, 19)}`}
            </caption>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th scope="col" className="py-1">
                  {t.crowd.zone}
                </th>
                <th scope="col" className="py-1">
                  {t.crowd.utilization}
                </th>
                <th scope="col" className="py-1">
                  {t.crowd.level}
                </th>
                <th scope="col" className="py-1">
                  {t.crowd.trend}
                </th>
              </tr>
            </thead>
            <tbody>
              {(snapshot?.zones ?? []).map((zone) => (
                <tr key={zone.zoneId} className="border-b border-slate-100 dark:border-slate-800">
                  <th scope="row" className="py-1 font-normal">
                    {zone.label}
                  </th>
                  <td className="py-1">{Math.round(zone.utilization * 100)}%</td>
                  <td className="py-1">
                    <LevelBadge level={zone.level} label={t.crowd.level} />
                  </td>
                  <td className="py-1">{zone.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {role === "organizer" ? (
        <Card className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">{t.crowd.recommendationsHeading}</h2>
            <DemoBadge mocked={recMocked && recommendation !== null} label={t.common.demoMode} />
          </div>
          <Button
            onClick={() => {
              void getRecommendations();
            }}
            disabled={loadingRec}
          >
            {loadingRec ? t.common.loading : t.crowd.getRecommendations}
          </Button>
          {recommendation === null ? null : (
            <div className="space-y-3" aria-live="polite">
              <p className="text-sm">{recommendation.summary}</p>
              <RecommendationList
                title={t.crowd.alerts}
                items={recommendation.alerts.map((a) => `${a.headline}: ${a.action}`)}
              />
              <RecommendationList
                title={t.crowd.gateReroutes}
                items={recommendation.gateReroutes.map(
                  (r) => `${r.fromGate} → ${r.toGate}: ${r.reason}`,
                )}
              />
              <RecommendationList
                title={t.crowd.staffingMoves}
                items={recommendation.staffingMoves.map(
                  (m) => `${m.zoneId}: ${m.action} (+${String(m.staffCount)})`,
                )}
              />
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

function RecommendationList({
  title,
  items,
}: {
  readonly title: string;
  readonly items: string[];
}): React.JSX.Element | null {
  if (items.length === 0) {
    return null;
  }
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
