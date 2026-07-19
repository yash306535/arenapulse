/**
 * F7 — Incident report form, shown inside a modal dialog. Validates lightly on
 * the client (the server re-validates with zod) and posts to /api/ops/incidents.
 */
"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useAppContext } from "@/i18n/app-context";
import { incidentCategorySchema, incidentSeveritySchema } from "@/schemas/ops";
import type { Incident, IncidentCreate } from "@/schemas/ops";

/** A zone option for the incident's location select. */
export interface ZoneOption {
  readonly id: string;
  readonly label: string;
}

export function IncidentForm({
  zones,
  reportedBy,
  onCreated,
}: {
  readonly zones: ZoneOption[];
  readonly reportedBy: IncidentCreate["reportedBy"];
  readonly onCreated: (incident: Incident) => void;
}): React.JSX.Element {
  const { t } = useAppContext();
  const [zoneId, setZoneId] = useState(zones[0]?.id ?? "");
  const [category, setCategory] = useState<IncidentCreate["category"]>("facilities");
  const [severity, setSeverity] = useState<IncidentCreate["severity"]>("low");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (event: React.SyntheticEvent): Promise<void> => {
    event.preventDefault();
    if (description.trim().length < 5) {
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const response = await fetch("/api/ops/incidents", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ zoneId, category, severity, description, reportedBy }),
      });
      if (!response.ok) {
        throw new Error("request failed");
      }
      onCreated((await response.json()) as Incident);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(event) => {
        void submit(event);
      }}
      className="space-y-3"
    >
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t.ops.zone}
        <select
          value={zoneId}
          onChange={(event) => {
            setZoneId(event.target.value);
          }}
          className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        >
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t.ops.category}
        <select
          value={category}
          onChange={(event) => {
            setCategory(event.target.value as IncidentCreate["category"]);
          }}
          className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        >
          {incidentCategorySchema.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t.ops.severity}
        <select
          value={severity}
          onChange={(event) => {
            setSeverity(event.target.value as IncidentCreate["severity"]);
          }}
          className="min-h-11 rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        >
          {incidentSeveritySchema.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        {t.ops.descriptionField}
        <textarea
          value={description}
          onChange={(event) => {
            setDescription(event.target.value);
          }}
          rows={3}
          maxLength={500}
          className="rounded-md border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800"
        />
      </label>
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {t.common.error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy || description.trim().length < 5}>
        {busy ? t.common.loading : t.ops.report}
      </Button>
    </form>
  );
}
