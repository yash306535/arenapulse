/**
 * Match schedule access. Validates the schedule fixture and exposes typed
 * lookups used by the Transit Planner and Sustainability Hub.
 */
import { z } from "zod";

import scheduleRaw from "@/data/schedule.json";

const matchSchema = z.object({
  id: z.string().min(1),
  stage: z.string().min(1),
  home: z.string().min(1),
  away: z.string().min(1),
  kickoffIso: z.string().min(1),
});

const scheduleSchema = z.object({
  venue: z.string().min(1),
  matches: z.array(matchSchema).min(1),
});

/** One fixture in the demo venue's schedule. */
export type Match = z.infer<typeof matchSchema>;

const schedule = scheduleSchema.parse(scheduleRaw);

/** The demo venue name used across transit and sustainability features. */
export function venueName(): string {
  return schedule.venue;
}

/** Returns every match at the venue, in kickoff order. */
export function listMatches(): Match[] {
  return [...schedule.matches].sort(
    (a, b) => new Date(a.kickoffIso).getTime() - new Date(b.kickoffIso).getTime(),
  );
}

/** Looks up a match by id, or undefined when absent. */
export function getMatch(id: string): Match | undefined {
  return schedule.matches.find((match) => match.id === id);
}
