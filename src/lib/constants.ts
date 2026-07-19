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
export const MAX_CHAT_MESSAGE_LENGTH = 2000;
/** Upper bound for retained chat history turns sent to the model. */
export const MAX_CHAT_HISTORY_TURNS = 20;
/** Upper bound for free-text query fields (search, destinations). */
export const MAX_QUERY_LENGTH = 200;
/** Upper bound for incident descriptions logged by venue staff. */
export const MAX_INCIDENT_DESCRIPTION_LENGTH = 500;
/** Upper bound for text submitted to the plain-language simplifier. */
export const MAX_SIMPLIFY_TEXT_LENGTH = 4000;

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
export const MAX_AI_OUTPUT_TOKENS = 1024;

/** How often clients poll the simulated crowd feed. */
export const CROWD_POLL_INTERVAL_MS = 5000;
/** Debounce applied to destination/search text inputs. */
export const SEARCH_DEBOUNCE_MS = 300;
/** Fixed seed so the crowd simulator is deterministic across runs. */
export const CROWD_SIMULATOR_SEED = 20_260_611;

/** Number of search results requested from Google Programmable Search. */
export const SEARCH_RESULT_COUNT = 5;

/** Gate + security queue buffer applied before kickoff when planning arrivals. */
export const ARRIVAL_BUFFER_MINUTES = 90;
/** Demo venue coordinates used for static map rendering (fictional location). */
export const STADIUM_LAT = 20.6767;
export const STADIUM_LNG = -103.3475;
/** Static map proxy bounds — requests outside these are rejected. */
export const STATIC_MAP_MIN_SIZE_PX = 100;
export const STATIC_MAP_MAX_SIZE_PX = 1200;
export const STATIC_MAP_MIN_ZOOM = 10;
export const STATIC_MAP_MAX_ZOOM = 18;
export const STATIC_MAP_DEFAULT_ZOOM = 15;
/** Cap on stored incidents so the in-memory ops log cannot grow unbounded. */
export const MAX_STORED_INCIDENTS = 200;
