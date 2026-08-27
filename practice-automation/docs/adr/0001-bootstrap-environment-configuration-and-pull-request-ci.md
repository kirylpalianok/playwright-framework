# 0001 — Bootstrap environment configuration and pull-request CI strategy

## Status

Accepted

## Context

Story 1 (`docs/project-backlog.md`) establishes the framework's first runnable slice: a
validated configuration boundary, one UI smoke test, one API smoke test, and an
automated pull-request check. Two decisions in that slice are durable and change how
every later story configures the environment and CI, so CLAUDE.md section 4 requires
recording them here before or with the change:

1. How the framework selects and validates its target environment (`docs/architecture.md`
   "environment model").
2. How pull requests get automated feedback without requiring credentials or touching
   protected environments (`docs/architecture.md` "CI execution strategy").

## Decision

### Environment configuration

- `src/core/config/environment.ts` is the single startup module allowed to read
  `process.env`. It is invoked once, synchronously, from `playwright.config.ts` (the
  runner's own startup module), and returns one immutable `EnvironmentConfig` object
  consumed by the Playwright config and, transitively, by every fixture and test.
- The only configurable settings are `BASE_URL` and the four central timeout classes
  (`ACTION_TIMEOUT_MS`, `NAVIGATION_TIMEOUT_MS`, `EXPECT_TIMEOUT_MS`, `TEST_TIMEOUT_MS`).
  All are optional and default to the public practice target
  (`https://practice-automation.com`) and the framework's existing timeout values, so the
  suite runs with no `.env` file.
- `BASE_URL` must parse as an absolute `https` URL or the config loader throws before any
  test runs, naming the invalid setting without echoing an untrusted value.
- No credential, token, or environment-specific secret is introduced by this story: the
  target is a public, read-only practice site, so no destructive-operation allowlist or
  confirmation setting is needed yet.

### Allure runtime registration

- `allure-js-commons`'s label/step API (`epic`, `feature`, `story`, `suite`, `severity`,
  and similar, used by `src/core/observability/allure/suite-metadata.ts`) only
  auto-registers its reporting runtime under the newer unified `playwright` test runner.
  Under the classic `@playwright/test` runner this repository uses, those calls silently
  no-op unless the runtime is registered explicitly first.
- `src/core/fixtures/framework.fixtures.ts` imports `allure-playwright/autoconfig` for
  its side effect (registering `AllurePlaywrightTestRuntime` as the global test runtime)
  once per worker process, before any fixture or test runs. This is the framework's one
  place doing so; no other module should import it.

### Pull-request CI strategy

- `.github/workflows/pull-request.yml` runs on every pull request targeting `main`, with
  `permissions: contents: read` and a concurrency group keyed to the PR number that
  cancels superseded runs.
- The job installs dependencies with `npm ci`, runs `npm run typecheck`, installs only
  the Chromium browser, and runs `npx playwright test --grep @smoke --project=chromium`.
  Firefox/WebKit and the full regression suite are intentionally out of scope for the
  pull-request gate until Story 17 evaluates browser matrix and CI capacity.
- The job always uploads the Playwright HTML report and Allure results
  (`if: ${{ !cancelled() }}`) so a failing smoke test has retrievable evidence; it does
  not use `continue-on-error` or any other mechanism that could report a failing test as
  healthy.
- First-party actions (`actions/checkout`, `actions/setup-node`, `actions/upload-artifact`)
  are pinned to their major version tag (`@v4`) rather than a specific commit SHA. A SHA
  pin is a stronger supply-chain guarantee, but this session could not independently
  verify an exact upstream commit SHA against the real release; committing an unverified
  SHA risks silently pinning to the wrong commit, which is worse than a maintained major
  tag. Revisit with verified SHAs once a repository-wide pinning policy is adopted.
- No repository secret is referenced by the workflow, so forked pull requests receive the
  same checks with no credential exposure.

## Alternatives considered

- **Zod or another schema library for `environment.ts`.** Rejected for this story: the
  schema is two scalar shapes (one URL, four positive integers), a hand-written validator
  is small and dependency-free, and CLAUDE.md section 12 disfavors adding a package to
  avoid a small local implementation. Revisit if the configuration surface grows
  materially.
- **Running the full browser matrix (Chromium/Firefox/WebKit) on every pull request.**
  Rejected: this triples smoke-suite runtime and external-target load for a public
  third-party site on every PR, for coverage CLAUDE.md 12 assigns to scheduled/manual
  runs. Story 17 owns the browser-matrix-vs-capacity decision.
- **SHA-pinning the GitHub Actions used.** Preferred long-term, but deferred until the
  pins can be verified against the real upstream releases (see decision above).

## Consequences

- Every future story that needs a new environment setting extends
  `EnvironmentConfig`/`loadEnvironmentConfig` and this ADR's setting list, and documents
  it in `docs/operations/configuration.md`, instead of reading `process.env` elsewhere.
- The pull-request gate stays fast and credential-free; broader coverage (regression
  suite, full browser matrix, scheduled runs) is deliberately deferred to Story 17.
- Adding a destructive or authenticated capability later requires revisiting this ADR's
  "no secrets yet" premise together with CLAUDE.md section 6 (environment allowlist,
  confirmation setting, idempotency, owner).

## Migration / rollback

Purely additive: reverting either decision means deleting
`src/core/config/environment.ts`'s env-reading behavior (falling back to the previous
hard-coded `playwright.config.ts` values) and/or deleting
`.github/workflows/pull-request.yml`. Neither has any persisted state to roll back.
