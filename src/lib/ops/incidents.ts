/**
 * In-memory incident store for the Ops Command Center (F7), seeded from the
 * fixtures. Deliberately database-free so judges can run the demo with zero
 * infrastructure; state is per-process and resets on restart (documented in
 * the README limitations section).
 */
import { z } from "zod";

import incidentsSeedRaw from "@/data/incidents.seed.json";
import { MAX_STORED_INCIDENTS } from "@/lib/constants";
import { incidentSchema } from "@/schemas/ops";
import type { Incident, IncidentCreate } from "@/schemas/ops";

const seedSchema = z.object({ incidents: z.array(incidentSchema).min(1) });

const seedIncidents: readonly Incident[] = seedSchema.parse(incidentsSeedRaw).incidents;

let incidents: Incident[] = [...seedIncidents];
let idCounter = seedIncidents.length;

/** Returns all incidents, newest first. */
export function listIncidents(): Incident[] {
  return [...incidents].sort(
    (a, b) => new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime(),
  );
}

/** Adds a validated incident report and returns the stored record. */
export function addIncident(create: IncidentCreate, now: Date = new Date()): Incident {
  idCounter += 1;
  const incident: Incident = {
    id: `inc-${String(idCounter).padStart(3, "0")}`,
    createdAtIso: now.toISOString(),
    status: "open",
    ...create,
  };
  incidents.push(incident);
  if (incidents.length > MAX_STORED_INCIDENTS) {
    incidents = incidents.slice(incidents.length - MAX_STORED_INCIDENTS);
  }
  return incident;
}

/** Restores the seed state — test-only helper. */
export function resetIncidentsForTest(): void {
  incidents = [...seedIncidents];
  idCounter = seedIncidents.length;
}
