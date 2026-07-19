/**
 * Application-wide named constants. Every "magic number" in the codebase lives
 * here so limits and tuning knobs are discoverable and documented in one place.
 */

/** Sliding-window length for the in-memory rate limiter. */
export const RATE_LIMIT_WINDOW_MS = 60_000;
/** Max requests per window for GenAI-backed routes (expensive upstream calls). */
export const AI_RATE_LIMIT_MAX_REQUESTS = 20;
/** Max requests per window for all other API routes. */
export const STANDARD_RATE_LIMIT_MAX_REQUESTS = 60;

/** Upper bound for a single chat message, in characters. */
export const MAX_CHAT_MESSAGE_LENGTH = 2_000;
/** Upper bound for retained chat history turns sent to the model. */
export const MAX_CHAT_HISTORY_TURNS = 20;
/** Upper bound for free-text query fields (search, destinations). */
export const MAX_QUERY_LENGTH = 200;
/** Upper bound for incident descriptions logged by venue staff. */
export const MAX_INCIDENT_DESCRIPTION_LENGTH = 500;
/** Upper bound for text submitted to the plain-language simplifier. */
export const MAX_SIMPLIFY_TEXT_LENGTH = 4_000;

/** TTL for cached Google Programmable Search results. */
export const SEARCH_CACHE_TTL_MS = 5 * 60_000;
/** TTL for cached transit plans. */
export const TRANSIT_CACHE_TTL_MS = 2 * 60_000;
/** TTL for cached knowledge-base assistant answers. */
export const KB_ANSWER_CACHE_TTL_MS = 10 * 60_000;
/** Max entries held by any in-memory cache before LRU eviction. */
export const CACHE_MAX_ENTRIES = 200;

/** Abort outbound Gemini/Maps/Search requests after this long. */
export const OUTBOUND_REQUEST_TIMEOUT_MS = 15_000;
/** Cap on model output size — bounds cost and prompt-injection blast radius. */
export const MAX_AI_OUTPUT_TOKENS = 1_024;

/** How often clients poll the simulated crowd feed. */
export const CROWD_POLL_INTERVAL_MS = 5_000;
/** Debounce applied to destination/search text inputs. */
export const SEARCH_DEBOUNCE_MS = 300;
/** Fixed seed so the crowd simulator is deterministic across runs. */
export const CROWD_SIMULATOR_SEED = 20_260_611;

/** Number of search results requested from Google Programmable Search. */
export const SEARCH_RESULT_COUNT = 5;
