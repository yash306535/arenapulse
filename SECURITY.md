# Security

ArenaPulse is a demo, but it is built to production security norms. This
document summarizes the threat model, key handling, and defenses.

## Threat model (summary)

| Asset / concern               | Threat                                  | Mitigation                                                                                                                                 |
| ----------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| API keys (Gemini/Maps/Search) | Leaking to the client or logs           | Read only in `src/lib/env.ts`; used only in server handlers; never `NEXT_PUBLIC_*`; never logged. Map images proxied via `/api/map-image`. |
| API routes                    | Malformed / oversized / injected input  | Zod `.strict()` on every body/query; length caps; generic `400` on failure.                                                                |
| Cost / abuse                  | Request floods to expensive AI routes   | Sliding-window rate limiter (20/min AI, 60/min other) → `429` + `Retry-After`.                                                             |
| Generative AI output          | XSS via rendered model text             | Markdown rendered with raw HTML disabled; **no `dangerouslySetInnerHTML`**.                                                                |
| Generative AI output          | Malformed structured output             | Zod-validated with one retry, then graceful mock fallback.                                                                                 |
| Prompt injection              | User/search content hijacking the model | System prompts scope to venue topics; untrusted content wrapped in labeled delimiters as data; output tokens capped.                       |
| Upstream latency / hangs      | Requests hanging on slow providers      | 15 s `AbortController` timeout on every outbound `fetch`.                                                                                  |
| Information disclosure        | Stack traces / secrets in responses     | Typed error envelope `{ error: { code, message } }`; details go to the level-aware logger only.                                            |

## Key handling

- All secrets are optional. When a key is absent (or `MOCK_MODE=true`), that
  service runs against a deterministic mock twin.
- `.env*` is gitignored; only `.env.example` (placeholders) is committed.
- No secret is ever interpolated into client code, logs, or error messages.

## Security headers

Set for every response in `next.config.ts`:

- `Content-Security-Policy` — `default-src 'self'`, `img-src 'self' data:`,
  `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`,
  `form-action 'self'`, and locked-down `connect-src`/`font-src`.
- `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, restrictive
  `Permissions-Policy`, and HSTS.

### Documented CSP relaxations

- `script-src 'unsafe-inline'` — required by Next.js' inline bootstrap scripts
  (a nonce-based CSP would need per-request middleware, out of scope here).
- `script-src 'unsafe-eval'` — **development only**, required by React Fast Refresh.
- `style-src 'unsafe-inline'` — required by Next.js' injected style tags.

Because Static Maps images are proxied through `/api/map-image`, the browser
never contacts a third-party image origin, so `img-src` stays `'self' data:`.

## Serverless caveat

The rate limiter and in-memory stores live in instance memory, so each
serverless instance enforces limits independently and cold starts reset state.
For production, back these with a shared store (e.g. Redis) or an API-gateway
policy.

## Other guarantees

- No `eval`, no dynamic `Function`, no shelling out.
- Dependencies are pinned; keep `npm audit --omit=dev --audit-level=high` clean.

## Reporting

This is a hackathon project without a production deployment. To report a
security concern, open a private issue or contact the repository maintainer.
Please do not include exploit details in public issues.
