# Architecture

ArenaPulse is a single Next.js (App Router) application. Every external
capability is isolated behind a server-side service with a deterministic mock
twin, so the whole app runs with zero API keys.

## Layering

The codebase enforces a one-directional dependency flow:

```
app/        Routing + thin API handlers (validate → call a lib service → shape a response)
components/ Presentational UI (ui/ primitives, layout/, features/) — no business logic
lib/        All logic and external services (pure, unit-testable functions)
schemas/    Zod schemas; every request/response/AI-output type derives via z.infer
data/       JSON fixtures (stadium map, schedule, knowledge base, incidents, carbon factors)
```

- **API route handlers stay under ~40 lines.** They enforce the rate limit,
  validate input with zod, call one `lib/` service, and return a JSON or SSE
  response. No business logic lives in `app/`.
- **`src/lib/env.ts` is the only reader of `process.env`.** It parses once with
  zod, freezes the result, and exposes `isServiceMocked()` so each service
  decides live-vs-mock independently.
- **`src/lib/logger.ts` is the only sanctioned console consumer** (`no-console`
  is enforced everywhere else).

## Module responsibilities

| Area           | Module(s)                                                                                 | Responsibility                                                                                       |
| -------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Environment    | `lib/env.ts`                                                                              | Parse/validate env once; report which services are mocked.                                           |
| AI             | `lib/ai/gemini.ts` (+ `.mock`), `prompts.ts`, `json.ts`, `chat-stream.ts`, `live-info.ts` | Gemini contract, prompt builders with injection defenses, untrusted-JSON parsing, SSE orchestration. |
| Maps           | `lib/google/maps.ts` (+ `.mock`)                                                          | Directions → `TransitPlan`; proxied Static Maps image.                                               |
| Search         | `lib/google/search.ts` (+ `.mock`)                                                        | Programmable Search → cited results, cached 5 min.                                                   |
| Navigation     | `lib/navigation/pathfinder.ts`, `lib/stadium.ts`                                          | Dijkstra over the validated stadium graph, optional step-free.                                       |
| Crowd          | `lib/crowd/simulator.ts`                                                                  | Deterministic seeded per-zone density snapshots.                                                     |
| Transit math   | `lib/transit/advice.ts`                                                                   | Pure leave-by / arrive-by computation with venue offset.                                             |
| Sustainability | `lib/sustainability/carbon.ts`                                                            | Travel-mode carbon comparison over the factors fixture.                                              |
| Ops            | `lib/ops/incidents.ts`                                                                    | In-memory incident store seeded from fixtures.                                                       |
| Cross-cutting  | `lib/cache.ts`, `lib/security/rate-limit.ts`, `lib/http/api.ts`, `lib/constants.ts`       | TTL/LRU cache, sliding-window limiter, shared HTTP helpers, named constants.                         |
| UI state       | `i18n/app-context.tsx`, `i18n/*`                                                          | Role + UI-language context persisted in the URL; en/es/fr dictionaries.                              |

## Request lifecycle — one chat message (F1)

1. **Client** (`components/features/assistant-chat.tsx`) POSTs `{ message, history, language }` to `/api/chat` and opens a `ReadableStream` reader (`chat-sse.ts`).
2. **Route** (`app/api/chat/route.ts`) calls `enforceRateLimit(request, aiRateLimiter)` then `readJsonBody(request, chatRequestSchema)` — a strict, length-bounded schema. Invalid input → `400` envelope; over budget → `429` + `Retry-After`.
3. **Orchestration** (`lib/ai/chat-stream.ts`): if `isLiveInfoQuery(message)` matches (schedule/weather/news/etc.), it calls the search service (F8) and formats cited results as clearly-labeled untrusted context.
4. **Gemini** (`lib/ai/gemini.ts`): builds the system prompt (`assistantSystemPrompt` — scopes the model to venue topics, injects the knowledge base, wraps user text as data) and streams tokens. On any error it transparently yields from the mock twin.
5. **SSE frames** are emitted back: a `meta` event (mock flag + cited sources), one `token` event per chunk, then `done`.
6. **Client** appends tokens into an `aria-live` region and renders them as sanitized markdown; cited sources render with source links.

The same validate → service → shape pattern applies to every other route; structured routes (`/api/crowd/recommend`, `/api/ops/briefing`) additionally validate the model's JSON against a zod schema with one retry before falling back.

## Determinism & testing

- Mock twins derive from fixtures and stable hashes, so identical inputs yield identical output.
- The crowd simulator is a pure function of `(timestamp, seed)`.
- Tests inject `fetch` or use the mock twins, never the network; coverage is gated at ≥ 85 % for `lib` and `app/api`.
