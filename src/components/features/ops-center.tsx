/**
 * F7 — Ops Command Center UI (operational intelligence + real-time decision
 * support). Shows KPI tiles and an incident log, lets organizers log incidents
 * and generate a structured Gemini shift briefing, and gives volunteers/fans a
 * filtered, simplified read-only view of the same data.
 */
"use client";

import { useEffect, useState } from "react";

import { IncidentForm, type ZoneOption } from "./incident-form";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBadge } from "@/components/ui/demo-badge";
import { Dialog } from "@/components/ui/dialog";
import { Tabs } from "@/components/ui/tabs";
import { useAppContext } from "@/i18n/app-context";
import type { Briefing, Incident, IncidentStatus } from "@/schemas/ops";

function KpiTile({
  label,
  value,
}: {
  readonly label: string;
  readonly value: number;
}): React.JSX.Element {
  return (
    <Card className="text-center">
      <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">{value}</p>
      <p className="text-sm text-slate-600 dark:text-slate-400">{label}</p>
    </Card>
  );
}

export function OpsCenter({ zones }: { readonly zones: ZoneOption[] }): React.JSX.Element {
  const { t, role } = useAppContext();
  const canManage = role === "organizer";
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [briefingMocked, setBriefingMocked] = useState(false);
  const [loadingBriefing, setLoadingBriefing] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/ops/incidents");
        if (response.ok) {
          setIncidents(((await response.json()) as { incidents: Incident[] }).incidents);
        }
      } catch {
        /* non-fatal; the log simply stays empty */
      }
    })();
  }, []);

  const countBy = (status: IncidentStatus): number =>
    incidents.filter((incident) => incident.status === status).length;

  const visibleIncidents = canManage
    ? incidents
    : incidents.filter((incident) => incident.status !== "resolved");

  const generateBriefing = async (): Promise<void> => {
    setLoadingBriefing(true);
    try {
      const response = await fetch("/api/ops/briefing", { method: "POST" });
      if (response.ok) {
        const body = (await response.json()) as { briefing: Briefing; mocked: boolean };
        setBriefing(body.briefing);
        setBriefingMocked(body.mocked);
      }
    } catch {
      /* leave prior briefing; button can be retried */
    } finally {
      setLoadingBriefing(false);
    }
  };

  const incidentPanel = (
    <div className="space-y-3">
      {canManage ? (
        <Button
          onClick={() => {
            setDialogOpen(true);
          }}
        >
          {t.ops.newIncident}
        </Button>
      ) : null}
      <Card>
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{t.ops.incidentLog}</caption>
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th scope="col" className="py-1">
                {t.ops.zone}
              </th>
              <th scope="col" className="py-1">
                {t.ops.category}
              </th>
              {canManage ? (
                <th scope="col" className="py-1">
                  {t.ops.severity}
                </th>
              ) : null}
              <th scope="col" className="py-1">
                Status
              </th>
              <th scope="col" className="py-1">
                {t.ops.descriptionField}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleIncidents.map((incident) => (
              <tr
                key={incident.id}
                className="border-b border-slate-100 align-top dark:border-slate-800"
              >
                <th scope="row" className="py-1 font-normal">
                  {incident.zoneId}
                </th>
                <td className="py-1">{incident.category}</td>
                {canManage ? <td className="py-1">{incident.severity}</td> : null}
                <td className="py-1">{incident.status}</td>
                <td className="py-1">{incident.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );

  const briefingPanel = (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          onClick={() => {
            void generateBriefing();
          }}
          disabled={loadingBriefing}
        >
          {loadingBriefing ? t.common.loading : t.ops.generateBriefing}
        </Button>
        <DemoBadge mocked={briefingMocked && briefing !== null} label={t.common.demoMode} />
      </div>
      {briefing === null ? null : (
        <Card className="space-y-3" aria-live="polite">
          <h3 className="text-lg font-semibold">{briefing.headline}</h3>
          <p className="text-sm">{briefing.overview}</p>
          <div>
            <h4 className="text-sm font-semibold">Key points</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {briefing.keyPoints.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
          {canManage && briefing.risks.length > 0 ? (
            <div>
              <h4 className="text-sm font-semibold">Risks</h4>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                {briefing.risks.map((risk, index) => (
                  <li key={index}>
                    {risk.risk} — {risk.mitigation}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader title={t.ops.heading} description={t.ops.description} />
      <div className="grid grid-cols-3 gap-3">
        <KpiTile label={t.ops.kpiOpen} value={countBy("open")} />
        <KpiTile label={t.ops.kpiMonitoring} value={countBy("monitoring")} />
        <KpiTile label={t.ops.kpiResolved} value={countBy("resolved")} />
      </div>
      <Tabs
        label={t.ops.heading}
        items={[
          { id: "incidents", label: t.ops.incidentLog, content: incidentPanel },
          { id: "briefing", label: t.ops.briefingHeading, content: briefingPanel },
        ]}
      />
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
        }}
        title={t.ops.newIncident}
        closeLabel={t.common.close}
      >
        <IncidentForm
          zones={zones}
          reportedBy="organizer"
          onCreated={(incident) => {
            setIncidents((prev) => [incident, ...prev]);
            setDialogOpen(false);
          }}
        />
      </Dialog>
    </div>
  );
}
