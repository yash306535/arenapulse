/**
 * Departure-time math for the Transit & Parking Planner (F5). Pure functions:
 * given a kickoff time and journey duration, compute when to arrive (kickoff
 * minus a security-queue buffer) and when to leave. Times keep the venue's
 * UTC offset so `HH:MM` substrings read as local time.
 */
import { ARRIVAL_BUFFER_MINUTES } from "@/lib/constants";

const OFFSET_PATTERN = /(?:([+-])(\d{2}):(\d{2})|Z)$/;

/** Arrival and departure recommendation, ISO strings in the venue's offset. */
export interface LeaveByAdvice {
  readonly arriveByIso: string;
  readonly leaveByIso: string;
}

function parseOffsetMinutes(iso: string): number {
  const match = OFFSET_PATTERN.exec(iso);
  if (match === null) {
    throw new RangeError("kickoffIso must end with a timezone offset or Z");
  }
  if (match[1] === undefined) {
    return 0;
  }
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}

function formatWithOffset(epochMs: number, offsetMinutes: number): string {
  const shifted = new Date(epochMs + offsetMinutes * 60_000).toISOString().slice(0, 19);
  if (offsetMinutes === 0) {
    return `${shifted}Z`;
  }
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const minutes = String(absolute % 60).padStart(2, "0");
  return `${shifted}${sign}${hours}:${minutes}`;
}

/**
 * Computes when a fan should arrive and leave for a match.
 * Throws RangeError on unparseable kickoff times or negative durations.
 */
export function computeLeaveBy(
  kickoffIso: string,
  journeyMinutes: number,
  bufferMinutes: number = ARRIVAL_BUFFER_MINUTES,
): LeaveByAdvice {
  const kickoffMs = Date.parse(kickoffIso);
  if (Number.isNaN(kickoffMs) || journeyMinutes < 0 || bufferMinutes < 0) {
    throw new RangeError("Invalid kickoff time or negative duration");
  }
  const offsetMinutes = parseOffsetMinutes(kickoffIso);
  const arriveByMs = kickoffMs - bufferMinutes * 60_000;
  const leaveByMs = arriveByMs - journeyMinutes * 60_000;
  return {
    arriveByIso: formatWithOffset(arriveByMs, offsetMinutes),
    leaveByIso: formatWithOffset(leaveByMs, offsetMinutes),
  };
}
