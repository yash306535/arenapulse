/**
 * F7 — Incident report form, shown inside a modal dialog. Validates lightly on
 * the client (the server re-validates with zod) and posts to /api/ops/incidents.
 */
"use client";

import { useState } from "react";

import { postJson, requestJson } from "./use-api-action";

import { Button } from "@/components/ui/button";
import { LabeledSelect, LabeledTextarea } from "@/components/ui/field";
import { useAppContext } from "@/i18n/app-context";
import { MAX_INCIDENT_DESCRIPTION_LENGTH } from "@/lib/constants";
import { incidentCategorySchema, incidentSeveritySchema } from "@/schemas/ops";
import type { Incident, IncidentCreate } from "@/schemas/ops";

/** A zone option for the incident's location select. */
export interface ZoneOption {
  readonly id: string;
  readonly label: string;
}

const MIN_DESCRIPTION_LENGTH = 5;

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
    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const incident = await requestJson<Incident>(
        "/api/ops/incidents",
        postJson({ zoneId, category, severity, description, reportedBy }),
      );
      onCreated(incident);
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
      <LabeledSelect
        label={t.ops.zone}
        value={zoneId}
        onValueChange={setZoneId}
        options={zones.map((zone) => ({ value: zone.id, label: zone.label }))}
      />
      <LabeledSelect
        label={t.ops.category}
        value={category}
        onValueChange={setCategory}
        options={incidentCategorySchema.options.map((option) => ({ value: option, label: option }))}
      />
      <LabeledSelect
        label={t.ops.severity}
        value={severity}
        onValueChange={setSeverity}
        options={incidentSeveritySchema.options.map((option) => ({ value: option, label: option }))}
      />
      <LabeledTextarea
        label={t.ops.descriptionField}
        value={description}
        onValueChange={setDescription}
        rows={3}
        maxLength={MAX_INCIDENT_DESCRIPTION_LENGTH}
      />
      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {t.common.error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy || description.trim().length < MIN_DESCRIPTION_LENGTH}>
        {busy ? t.common.loading : t.ops.report}
      </Button>
    </form>
  );
}
