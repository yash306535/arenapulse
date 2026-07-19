/**
 * UI string dictionary contract. Every UI-language file (en/es/fr) implements
 * this exact shape so the language switcher can swap chrome text while the AI
 * assistant answers in any of the six supported languages. Feature body text
 * that comes from AI/services is not translated here — only static UI chrome.
 */

/** The complete set of translatable UI strings for one language. */
export interface Dictionary {
  readonly app: {
    readonly name: string;
    readonly tagline: string;
    readonly nonAffiliation: string;
  };
  readonly nav: {
    readonly label: string;
    readonly home: string;
    readonly assistant: string;
    readonly navigation: string;
    readonly crowd: string;
    readonly access: string;
    readonly transit: string;
    readonly sustainability: string;
    readonly ops: string;
  };
  readonly roles: {
    readonly label: string;
    readonly fan: string;
    readonly volunteer: string;
    readonly organizer: string;
  };
  readonly languages: {
    readonly label: string;
  };
  readonly common: {
    readonly skipToContent: string;
    readonly demoMode: string;
    readonly loading: string;
    readonly error: string;
    readonly retry: string;
    readonly send: string;
    readonly submit: string;
    readonly sources: string;
    readonly simulatedFeed: string;
    readonly close: string;
  };
  readonly home: {
    readonly heading: string;
    readonly intro: string;
    readonly roleHeading: string;
    readonly roleIntro: string;
    readonly featuresHeading: string;
    readonly capabilitiesHeading: string;
    readonly open: string;
  };
  readonly assistant: {
    readonly heading: string;
    readonly description: string;
    readonly inputLabel: string;
    readonly placeholder: string;
    readonly conversation: string;
    readonly you: string;
    readonly assistantName: string;
    readonly languageChips: string;
    readonly emptyState: string;
  };
  readonly navigation: {
    readonly heading: string;
    readonly description: string;
    readonly origin: string;
    readonly destination: string;
    readonly stepFree: string;
    readonly getDirections: string;
    readonly routeHeading: string;
    readonly stepsHeading: string;
    readonly noRoute: string;
    readonly totalDistance: string;
  };
  readonly crowd: {
    readonly heading: string;
    readonly description: string;
    readonly zone: string;
    readonly utilization: string;
    readonly level: string;
    readonly trend: string;
    readonly getRecommendations: string;
    readonly recommendationsHeading: string;
    readonly alerts: string;
    readonly gateReroutes: string;
    readonly staffingMoves: string;
    readonly updated: string;
  };
  readonly access: {
    readonly heading: string;
    readonly description: string;
    readonly directoryHeading: string;
    readonly simplifyHeading: string;
    readonly announcementLabel: string;
    readonly readingLevel: string;
    readonly simple: string;
    readonly verySimple: string;
    readonly simplify: string;
    readonly resultHeading: string;
  };
  readonly transit: {
    readonly heading: string;
    readonly description: string;
    readonly match: string;
    readonly origin: string;
    readonly mode: string;
    readonly modeTransit: string;
    readonly modeDrive: string;
    readonly modeWalk: string;
    readonly plan: string;
    readonly planHeading: string;
    readonly leaveBy: string;
    readonly arriveBy: string;
    readonly mapAlt: string;
  };
  readonly sustainability: {
    readonly heading: string;
    readonly description: string;
    readonly mode: string;
    readonly distance: string;
    readonly compare: string;
    readonly comparisonHeading: string;
    readonly savedVsCar: string;
    readonly tipHeading: string;
  };
  readonly ops: {
    readonly heading: string;
    readonly description: string;
    readonly kpiOpen: string;
    readonly kpiMonitoring: string;
    readonly kpiResolved: string;
    readonly incidentLog: string;
    readonly newIncident: string;
    readonly zone: string;
    readonly category: string;
    readonly severity: string;
    readonly descriptionField: string;
    readonly report: string;
    readonly briefingHeading: string;
    readonly generateBriefing: string;
  };
}
