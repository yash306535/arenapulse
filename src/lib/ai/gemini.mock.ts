/**
 * Deterministic mock twin of the Gemini service. Active whenever
 * GEMINI_API_KEY is absent or MOCK_MODE=true, and the graceful fallback when
 * live AI output fails validation. Every response derives from fixtures or
 * simple rules, so the whole app demos identically with zero keys.
 */
import type { ChatStreamRequest, GeminiService } from "./gemini";

import { findKbMatches } from "@/lib/kb";
import { describeRoute } from "@/lib/navigation/pathfinder";
import type { ModeComparison } from "@/lib/sustainability/carbon";
import type { Language } from "@/schemas/common";
import type { CrowdRecommendation, CrowdSnapshot, ZoneDensity } from "@/schemas/crowd";
import type { RouteResult } from "@/schemas/navigation";
import type { Briefing, Incident } from "@/schemas/ops";
import type { SimplifyRequest } from "@/schemas/simplify";
import type { TransitPlan } from "@/schemas/transit";

const GREETINGS: Record<Language, string> = {
  en: "Here is what I found in the stadium guide:",
  es: "Esto es lo que encontré en la guía del estadio:",
  fr: "Voici ce que j'ai trouvé dans le guide du stade :",
  ar: "هذا ما وجدته في دليل الملعب:",
  pt: "Aqui está o que encontrei no guia do estádio:",
  hi: "स्टेडियम गाइड में मुझे यह मिला:",
};

const NO_MATCH_ANSWER =
  "I could not find that in the stadium guide. I can help with gates, seating, food, prayer rooms, first aid, accessibility services, sustainability, and getting to the stadium.";

/** Word-level streaming with a short pacing delay outside of tests. */
async function* streamWords(text: string): AsyncGenerator<string, void, undefined> {
  const paced = process.env.VITEST === undefined;
  for (const word of text.split(/(?=\s)/)) {
    if (paced) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    yield word;
  }
}

function chatAnswer(request: ChatStreamRequest): string {
  const matches = findKbMatches(request.message);
  const greeting = GREETINGS[request.language ?? "en"];
  const searchNote =
    request.searchContext === undefined
      ? ""
      : "\n\n_Demo mode: live search results are simulated._";
  if (matches.length === 0) {
    return `${greeting}\n\n${NO_MATCH_ANSWER}${searchNote}`;
  }
  const body = matches.map((entry) => `**${entry.question}**\n${entry.answer}`).join("\n\n");
  return `${greeting}\n\n${body}${searchNote}`;
}

function percent(zone: ZoneDensity): string {
  return `${String(Math.round(zone.utilization * 100))}%`;
}

function crowdRules(snapshot: CrowdSnapshot): CrowdRecommendation {
  const byUtilization = [...snapshot.zones].sort((a, b) => b.utilization - a.utilization);
  const busy = byUtilization.filter((zone) => zone.level === "high" || zone.level === "critical");

  const gateZones = snapshot.zones.filter((zone) => zone.zoneId.startsWith("zone-gate-"));
  const busiestGate = [...gateZones].sort((a, b) => b.utilization - a.utilization)[0];
  const quietestGate = [...gateZones].sort((a, b) => a.utilization - b.utilization)[0];
  const gateReroutes =
    busiestGate !== undefined &&
    quietestGate !== undefined &&
    busiestGate.zoneId !== quietestGate.zoneId &&
    (busiestGate.level === "high" || busiestGate.level === "critical")
      ? [
          {
            fromGate: busiestGate.zoneId.replace("zone-", ""),
            toGate: quietestGate.zoneId.replace("zone-", ""),
            reason: `${busiestGate.label} is at ${percent(busiestGate)} while ${quietestGate.label} is at ${percent(quietestGate)}.`,
          },
        ]
      : [];

  return {
    summary:
      busy.length === 0
        ? "All zones are within comfortable density. No action required."
        : `${String(busy.length)} zone(s) at high or critical density; busiest is ${busy[0]?.label ?? ""} at ${busy[0] === undefined ? "" : percent(busy[0])}.`,
    alerts: busy.slice(0, 8).map((zone) => ({
      zoneId: zone.zoneId,
      severity: zone.level === "critical" ? ("critical" as const) : ("warning" as const),
      headline: `${zone.label} at ${percent(zone)} of capacity`,
      action:
        zone.level === "critical"
          ? "Hold new entries, open overflow routes, and announce alternates."
          : "Increase steward presence and monitor for five minutes.",
    })),
    gateReroutes,
    staffingMoves: byUtilization.slice(0, 2).map((zone) => ({
      zoneId: zone.zoneId,
      action: "Reposition stewards from low-density zones to relieve congestion.",
      staffCount: zone.level === "critical" ? 6 : 4,
    })),
  };
}

function briefingRules(incidents: Incident[], snapshot: CrowdSnapshot): Briefing {
  const open = incidents.filter((incident) => incident.status !== "resolved");
  const byUtilization = [...snapshot.zones].sort((a, b) => b.utilization - a.utilization);
  const busiest = byUtilization[0];
  return {
    headline: `${String(open.length)} active incident(s); ${busiest?.label ?? "venue"} is the busiest zone`,
    overview:
      `The venue has ${String(incidents.length)} logged incidents this shift, of which ${String(open.length)} still need attention. ` +
      `Crowd flow is ${busiest?.level === "critical" ? "strained" : "manageable"}; the busiest zone is ${busiest?.label ?? "n/a"} at ${busiest === undefined ? "" : percent(busiest)} of capacity. Data shown is simulated for demo purposes.`,
    keyPoints: (open.length > 0 ? open : incidents)
      .slice(0, 6)
      .map(
        (incident) =>
          `[${incident.severity.toUpperCase()}] ${incident.category} in ${incident.zoneId}: ${incident.description}`,
      ),
    risks: byUtilization
      .filter((zone) => zone.level === "critical" || zone.level === "high")
      .slice(0, 4)
      .map((zone) => ({
        risk: `${zone.label} congestion (${percent(zone)})`,
        mitigation: "Deploy stewards, open secondary routes, and announce quieter alternatives.",
      })),
    staffingActions: [
      "Confirm steward coverage at all four gates before the next crowd peak.",
      "Keep one first-aid team on standby at the busiest concourse.",
    ],
    zonesToWatch: byUtilization.slice(0, 3).map((zone) => ({
      zoneId: zone.zoneId,
      reason: `${percent(zone)} of capacity, trend ${zone.trend}.`,
    })),
  };
}

const SIMPLIFICATIONS: readonly [RegExp, string][] = [
  [/\bapproximately\b/gi, "about"],
  [/\bprohibited\b/gi, "not allowed"],
  [/\bproceed\b/gi, "go"],
  [/\bpurchase\b/gi, "buy"],
  [/\badditional\b/gi, "more"],
  [/\bassistance\b/gi, "help"],
  [/\bcommence([sd])?\b/gi, "start$1"],
  [/\bdepart(s|ed)?\b/gi, "leave$1"],
];

/** Creates the deterministic mock Gemini service. */
export function createMockGeminiService(): GeminiService {
  return {
    mocked: true,

    streamChat(request: ChatStreamRequest): AsyncGenerator<string, void, undefined> {
      return streamWords(chatAnswer(request));
    },

    narrateRoute(route: RouteResult, _language: Language): Promise<string> {
      const steps = describeRoute(route);
      return Promise.resolve(
        `Here is your route (demo mode, English only):\n\n${steps.join("\n")}`,
      );
    },

    recommendCrowdActions(snapshot: CrowdSnapshot): Promise<CrowdRecommendation> {
      return Promise.resolve(crowdRules(snapshot));
    },

    generateBriefing(incidents: Incident[], snapshot: CrowdSnapshot): Promise<Briefing> {
      return Promise.resolve(briefingRules(incidents, snapshot));
    },

    simplifyText(request: SimplifyRequest): Promise<string> {
      const simplified = SIMPLIFICATIONS.reduce(
        (text, [pattern, replacement]) => text.replace(pattern, replacement),
        request.text,
      );
      return Promise.resolve(`Plain language version (demo mode):\n\n${simplified}`);
    },

    sustainabilityTip(comparison: ModeComparison[], mode: string): Promise<string> {
      const current = comparison.find((entry) => entry.mode === mode);
      const best = comparison.find((entry) => !["walk", "bike"].includes(entry.mode));
      const greenest = comparison[0];
      if (!current || !greenest || !best) {
        return Promise.resolve("Travel light, refill your bottle, and recycle on the concourse.");
      }
      const saving = current.gramsCo2e - best.gramsCo2e;
      return Promise.resolve(
        saving > 0
          ? `Switching from ${current.label.toLowerCase()} to ${best.label.toLowerCase()} would save about ${String(saving)} g of CO2e on this trip — and you skip the parking queues. Bring a reusable bottle; refill stations are free.`
          : `Great choice — ${current.label.toLowerCase()} is already one of the lowest-carbon ways to reach the stadium. Bring a reusable bottle; refill stations are free.`,
      );
    },

    transitAdvice(plan: TransitPlan, _kickoffIso: string, leaveByIso: string): Promise<string> {
      const time = leaveByIso.slice(11, 16);
      return Promise.resolve(
        `Leave by ${time} local time. Your ${plan.mode} journey takes about ${String(Math.round(plan.totalDurationMinutes))} minutes, and the buffer covers security queues at the gates.`,
      );
    },
  };
}
