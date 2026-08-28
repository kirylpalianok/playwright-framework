# 0002 — Read-only HTTP request capability

## Status

Accepted

## Context

Story 1 made one API request directly from a specification through Playwright's built-in
`request` fixture. Story 4 (`docs/project-backlog.md`) needs repeatable read-only API
checks that later stories can reuse — Story 11 validates a download's HTTP response and
Story 13 asserts documented broken-resource statuses — with consistent diagnostics and no
environment access outside validated configuration.

That makes the shape of the framework's HTTP boundary a durable decision: it introduces a
public extension point every future API and UI-plus-network test will build on, and it
adds a setting to the environment model recorded in ADR 0001. CLAUDE.md sections 4 and 8
require recording it here.

The risk to avoid is the pattern CLAUDE.md section 14 prohibits: a duplicate request
wrapper or catch-all client that grows mutation methods, arbitrary verbs, and per-call
environment overrides until tests can quietly change public data.

## Decision

### A narrow capability, not a service client

- `src/api/requests/read-only-http-requests.ts` exposes exactly two operations, `get` and
  `head`, over site-relative paths. There is no `post`, `put`, `patch`, or `delete`, and
  no method that takes a raw request body, header set, or absolute environment URL.
- The capability lives in a new `src/api/requests/` directory rather than
  `src/api/clients/`. A client in this repository is a *named service* client for a proven
  API consumer (`docs/architecture.md`, API layer); this is a transport capability shared
  by unrelated endpoints. A named client is still deferred until one stable API behavior
  has a credible second consumer.
- `get` returns a response whose body is only reachable through
  `readJson(validate)`, so an untrusted payload cannot enter a test without passing a
  schema from `src/api/schemas`. `head` returns metadata only, matching the HTTP contract.
- Responses are exposed as plain `status` / `headers` / `url` data rather than Playwright's
  `APIResponse`, so specifications assert on the contract instead of the transport object.

### Construction-time configuration

- `src/core/fixtures/framework.fixtures.ts` owns the `APIRequestContext` lifecycle, as
  `docs/architecture.md` assigns to fixtures. It applies the base URL, the API request
  timeout class, and an `x-correlation-id` header of `<runId>/<testId>` once, at
  construction, and disposes the context in `finally` when the test ends.
- Each test receives its own request context, so no connection, cookie, or header state
  crosses tests running in parallel.
- The API timeout class is a new `API_TIMEOUT_MS` setting on `EnvironmentConfig`
  (default `15000`). It reaches the test scope as the typed Playwright option
  `apiRequestTimeoutMs`, declared in `src/core/config/framework-test-options.ts` and set
  by `playwright.config.ts` from the validated configuration. This keeps ADR 0001's rule
  intact: `environment.ts` remains the only module that reads `process.env`.

### Diagnostics

- Every request emits one structured `http-read-request` log record with the method and
  path, outcome, elapsed duration, and a small `details` object carrying the response
  status and content type. Bodies and full header sets are never logged.
- A transport failure and a malformed JSON body are translated into errors that name the
  failed operation, the expected condition, the actual condition, and the next diagnostic
  action, preserving the original error as `cause`. The malformed-JSON message includes
  the status, content type, and a whitespace-collapsed 200-character body preview, which
  is what distinguishes a moved endpoint from an error or block page. That preview is an
  exception to CLAUDE.md section 6 and is recorded below.
- Structured log records carry only the error's own message, truncated before the call log
  Playwright appends to transport errors. That call log lists the outgoing request headers
  as free text, which the framework's key-based redaction cannot reach; the full error,
  including its call log, still reaches the Playwright report and the `cause` chain, where
  it is not re-emitted as a collected log line.

### Exception record — raw body preview in malformed-JSON errors

| Field | Value |
| --- | --- |
| Rule | CLAUDE.md section 6: "Treat secrets as write-only: never print, return, serialize, attach, or place them in errors." |
| Technical reason | Status and content type alone do not distinguish a moved endpoint, an HTML error page, and a WAF block page — the three realistic causes of a non-JSON body. A short preview identifies which, and is the single most useful line for triaging this failure. |
| Scope | `BODY_PREVIEW_LIMIT` in `src/api/requests/read-only-http-requests.ts`, reached only when a `GET` body fails `JSON.parse`. Bounded to 200 whitespace-collapsed characters. No other error or log record includes body content. |
| Owner | Framework maintainer (repository author in `package.json`). |
| Risk | If an authenticated or PII-bearing endpoint is added later, a malformed response could place sensitive content into CI output and Allure. |
| Mitigation | The target is a public, unauthenticated, read-only site with no credentials configured (ADR 0001). The capability sends no authorization header and cannot issue a mutating request. |
| Review date | 2026-11-30, or immediately at the first story that introduces a credential or an authenticated endpoint, whichever is earlier. At review, either drop the preview or replace it with a redacted, allow-listed summary. |

### Runtime validation helpers

- `src/core/validation/json-boundary.ts` provides `requireJsonObject`, returning a reader
  with `requireString`, `requireNonEmptyString`, and `requireStringArray`. Schemas compose
  it so every boundary failure names the boundary, the field, and the *type* received —
  never the received value, so an unexpected payload cannot leak its contents into logs or
  reports.

## Alternatives considered

- **Keep using Playwright's built-in `request` fixture directly in specifications.**
  Rejected: base URL, timeout, correlation identifiers, and sanitized logging would be
  re-decided in every test, and Story 4 explicitly requires them centralized at
  construction.
- **A general HTTP client with all verbs and an option bag.** Rejected: it is the
  duplicate-wrapper/catch-all client CLAUDE.md section 14 prohibits, and it would make
  mutating a public practice site a one-line change. Mutation support requires its own
  story with a data owner, collision-resistant identity, idempotent cleanup, and
  environment gating.
- **Calling `loadEnvironmentConfig()` from the fixture module to get the API timeout.**
  Rejected: it would re-read and re-validate `process.env` outside the single startup
  boundary. Passing the validated value through a typed Playwright option keeps one
  loader and one validation point.
- **A schema library (Zod or similar) for the JSON boundary helpers.** Rejected for the
  same reason as ADR 0001: the validated shapes are a handful of string and string-array
  fields. Revisit when a response contract is large or deeply nested enough that a
  hand-written reader stops being clearer than a schema.

## Consequences

- Later API work adds a schema in `src/api/schemas` and a specification that composes the
  existing capability; it should not add another request path. Any need for a verb beyond
  `GET`/`HEAD` is a deliberate decision that supersedes this ADR.
- Stories 11 and 13 can assert download and broken-resource statuses through the same
  capability, with identical logs and failure messages.
- Redaction of request/response *values* remains key-based, so it cannot reach text
  embedded in an error message. `serializeError` in
  `src/core/observability/logging/structured-logger.ts` therefore truncates a Playwright
  call log out of every logged message, framework-wide, rather than only in this
  capability. The remaining raw-content surface is the recorded body-preview exception
  above, which the same review date covers.

## Migration / rollback

Additive. Reverting means deleting `src/api/requests/`,
`src/core/validation/json-boundary.ts`, `src/core/config/framework-test-options.ts`, and
the `API_TIMEOUT_MS` setting, and pointing the two API specifications back at Playwright's
built-in `request` fixture. No persisted state is involved.
