/**
 * Heuristic that decides when an assistant question needs grounded live
 * information (F8) — schedules, weather, news, transit disruptions — in which
 * case the chat route attaches cited web search results as untrusted context.
 */

const LIVE_INFO_PATTERNS: readonly RegExp[] = [
  /\bschedule\b|\bfixtures?\b|\bkick-?off\b|\bwhen .{0,20}(match|game|play)/i,
  /\bweather\b|\bforecast\b|\brain\b|\btemperature\b|\bheat\b/i,
  /\bnews\b|\bheadlines?\b|\btoday\b|\blatest\b|\bright now\b|\bcurrent\b/i,
  /\bscores?\b|\bresults?\b|\bstandings?\b|\bwho won\b/i,
  /\bstrike\b|\bdisruption\b|\bdelay(s|ed)?\b|\bclosure\b/i,
];

/** Returns true when the message likely needs live, time-sensitive information. */
export function isLiveInfoQuery(message: string): boolean {
  return LIVE_INFO_PATTERNS.some((pattern) => pattern.test(message));
}
