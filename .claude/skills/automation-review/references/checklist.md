# Automation review checklist

Detailed per-category checks for the `automation-review` skill. Each item references the rule it enforces (`CLAUDE.md` section, cited as `CLAUDE.md §N`, or a `docs/architecture.md` section by name). Use this as a checklist, not a script: skip items that do not apply to the file at hand, and apply items not listed here when a file clearly violates the spirit of the standard.

## Cross-cutting checks (apply to every file)

- **Locator quality** (`CLAUDE.md §7`): locators use `getByRole` → `getByLabel` → `getByPlaceholder` → contractual `getByText` → deliberately named `data-testid`, in that preference order. No CSS/layout selectors, DOM traversal, generated IDs, XPath, coordinates, or `nth()` unless position is the behavior under test. A locator used for an action/assertion must resolve to exactly one element in that state — a strict-mode violation is a defect to fix, not to suppress.
- **Web-first assertions** (`CLAUDE.md §7, §10`): every consequential action (click, fill, submit, navigation) is followed by an `expect(locator)...` web-first assertion of meaningful state. A successful action alone (no throw) is not verification. No `expect(await ...)` patterns that defeat auto-retrying assertions.
- **Synchronization** (`CLAUDE.md §10, §14`): no `page.waitForTimeout`, `setTimeout`, sleep helpers, unbounded polling, or blanket `networkidle` waits. No `force: true` without a documented browser-limitation exception plus a passing assertion of the intended effect. Navigation/popup/download/event waits are registered *before* the trigger when the event is part of the tested contract.
- **Test isolation & parallel safety** (`CLAUDE.md §7, §9`): each test gets its own `BrowserContext`/`Page`/`APIRequestContext` and its own generated data unless a documented fixture partitions access safely. No shared mutable module-level state, no order dependency, no reliance on another test's side effects. Serial execution requires a recorded exception (technical reason, scope, owner).
- **Assertion placement**: business assertions live in the test (`.spec.ts`), not inside page objects, components, clients, or fixtures. Adapters may expose semantic queries/locators but must not decide pass/fail.
- **TypeScript quality** (`CLAUDE.md §5`): strict types preserved; no `any`, `@ts-ignore`, `@ts-nocheck`, unchecked type assertions, or non-null assertions used to silence a real defect. `unknown` only at trust boundaries, narrowed/validated immediately. Named exports preferred; `interface` for exported object contracts, `type` for unions/tuples/local composition. Options object (not stacked booleans) once an operation has more than two meaningful inputs. Every `Promise` is awaited — no floating promises, including in assertions/cleanup.
- **Unnecessary abstraction / duplication** (`CLAUDE.md §3, §14`, `architecture.md` "Extension guidelines"): no page object, component, client, or port created for a single, non-volatile consumer. No `BasePage`, generic element wrappers, one-method wrapper functions, or catch-all `utils`/`common`/`helpers`/`manager`/`base` modules. Duplicate request/browser plumbing across files is a defect, not acceptable repetition.
- **Architectural dependency direction** (`CLAUDE.md §4`, `architecture.md` "Dependency rules"): tests → fixtures/adapters/builders only, never reusable browser/HTTP plumbing living in a test file. `src/ui` and `src/api` never create test data, choose environments, read `process.env`, or invoke reporters. Nothing imports from `tests/`. No layer imports outward from a more concrete layer into a more abstract one.
- **Flaky-test risk**: flag any change that hides a real timing/selector problem behind a longer timeout, an added retry, a broadened try/catch, or a wait that isn't tied to an observable condition. A timeout increase without a diagnosed root cause is a symptom, not a fix.
- **Security / secret exposure** (`CLAUDE.md §6, §11`): no hard-coded credentials, tokens, tenant identifiers, or environment URLs in source. No secret, cookie, auth header, or PII value logged, returned, attached as evidence, or interpolated into an error message unredacted. Only `.env.example` (safe placeholder values) may be committed — never a real `.env`, storage-state file, or secret-bearing fixture.

## Playwright UI tests (`tests/ui/**/*.spec.ts`, `tests/accessibility/**/*.spec.ts`)

- One primary behavior per test; multiple assertions allowed only when they jointly specify that same behavior.
- Test name is business language (e.g. "customer submits an order with a valid payment method"), not a number, framework term, or "should" prefix.
- `beforeEach`/`beforeAll` establish only essential shared context — never the business action under test, never a hidden assertion.
- Standard tags only (`@smoke`, `@regression`, `@ui`, `@api`) unless a new tag is documented with owner/selection command/CI use.
- Critical views/flows include accessibility coverage (keyboard operation, accessible role/name) — not represented as complete a11y assurance if only an automated rule scan.
- Prefers API setup for deterministic UI preconditions when faster/more reliable, reserving browser interaction for the behavior actually under test.

## Page objects (`src/ui/pages/**/*.page.ts`)

- Filename and class named for a recognizable UI page (`.page.ts`, e.g. `SignInPage`).
- Constructed with the narrowest dependency (`Page`, or `Locator`/`Page` for a component).
- Exposes intent-revealing operations (`startCountdown()`) and semantic state queries — never generic `click()`/`fill()`/raw-selector passthroughs.
- No test-data creation, environment selection, `process.env` reads, or Allure/reporter calls inside the page object.
- No scenario-specific expectations embedded in the adapter — the adapter may expose state; the test decides pass/fail.
- `waitUntilReady()` (if present) waits on one documented, reusable, observable invariant — not a proxy for "sleep a bit."
- Returns another page/component only when the UI contract guarantees that transition; validation/permission/stay-on-page outcomes are modeled explicitly, not assumed.
- No inheritance hierarchy of page objects; composition only.

## UI components (`src/ui/components/**/*.component.ts`)

- Extracted only because the region is reused across pages or is independently meaningful — not as a preemptive one-method wrapper around a single element.
- Same locator, assertion-placement, and no-business-data rules as page objects.
- Constructed from `Locator` or `Page`, scoped to its container — not the whole page.

## API tests (`tests/api/**/*.spec.ts`)

- Verifies status code, contractually relevant headers, the runtime response schema, and the business outcome — not incidental fields, unstable ordering, timestamps, or implementation metadata.
- Covers the equivalence classes the published contract defines (success, validation, auth[nz], absent-resource, conflict, idempotency) where applicable — without multiplying near-duplicate cases that add no new risk coverage.
- Does not call a live third-party system from a deterministic CI test without an approved sandbox/virtualization strategy.
- Mutating endpoints have a clear data owner, collision-resistant identity (run id + test id), and idempotent, fixture-owned cleanup.

## API clients (`src/api/clients/**`)

- Exists only for a stable behavior with a credible consumer — not created speculatively.
- Owns request construction, safe defaults, correlation identifiers, response-status handling, and mapping to a validated result; centralizes base URL/auth/timeout class at construction.
- Validates every untrusted response body against an explicit schema (`src/api/schemas/**`) before returning data — compile-time types alone are not validation.
- Does not read `process.env`, choose the environment, own business scenarios, or perform global cleanup.
- Request/response logging is sanitized (no raw auth headers, cookies, tokens, PII).

## Playwright configuration (`playwright.config.ts`)

- Remains a composition/configuration entry point — no business workflow logic.
- Configuration is loaded and validated exactly once (the single startup module) and injected via `use`; no other module reads `process.env`.
- Central timeout classes (test/action/navigation/expectation) stay defined here with rationale; a per-test override needs an exception record.
- Retries stay `0` locally; any CI-only retry is classified, evidence-preserving (trace on first retry), and linked to a flakiness investigation — not blanket.
- `screenshot`/`trace`/`video` policy matches the documented evidence policy (failure screenshots, first-retry traces, video off by default) unless a change is justified and documented.
- Reporters, projects, and `fullyParallel`/worker settings changes are evaluated against account capacity, data isolation, rate limits, and CI resources — not adjusted incidentally.

## Fixtures (`src/core/fixtures/**`)

- Is the composition root: constructs validated configuration, concrete adapters/clients, test-data lifecycle services, and test-scoped logging — nothing here is a place to hide a business action.
- Creates a fresh `BrowserContext`/`Page`/`APIRequestContext` and a unique run/test identifier per test unless partitioning is explicitly documented and proven parallel-safe.
- Owns creator-side cleanup in teardown/`finally`; cleanup is idempotent, limited to owned resources, and a cleanup failure is supplemental evidence that never replaces the primary failure.
- Does not become a catch-all for unrelated application behavior; each fixture has one coherent composition responsibility.

## Test-data builders and lifecycle (`tests/test-data/builders/**`, `tests/test-data/lifecycle/**`)

- Builders provide safe defaults with explicit overrides — no hand-built payloads scattered across specs, no opaque shared fixtures.
- Every mutable record carries an owner and a collision-resistant identity (run id + test id); data is synthetic and non-production-like.
- Lifecycle/cleanup is idempotent, environment-gated, and limited to resources the test system owns; seed/reset operations are not available by default in PR/dev execution.
- No broad global-state seeding to test a narrow behavior.

## TypeScript configuration (`tsconfig*.json`)

- Strict mode and related safety flags (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals`/`Parameters`, etc.) are preserved, not loosened, without a documented reason.
- `include`/module settings stay consistent with the repo's configured ESM style (`NodeNext`/`type: module`) — a change here has wide blast radius and needs explicit justification.
- Any relaxation (e.g. dropping `strict`, adding `skipLibCheck` beyond what's already accepted) is flagged at least HIGH and needs a stated rationale.

## ESLint / Prettier configuration

- Rules that enforce this standard (no floating promises, no explicit `any`, import boundaries between layers, etc.) are not weakened or disabled inline (`eslint-disable`) without a scoped, justified comment tied to a real constraint.
- A new dependency/plugin needs compatibility/maintenance/security rationale, not just convenience.
- Formatting config changes should not silently reformat unrelated files in the same diff (flag unrelated churn).

## CI-related test configuration (`.github/workflows/**`)

- Least-privilege `permissions`, explicit `concurrency` policy, deterministic Node/Playwright setup, and pinned action references are present.
- PR-triggered workflows stay non-destructive and fork-safe: install, lint/typecheck, targeted tests, safe artifact publication only — no protected credentials exposed to a fork.
- No `continue-on-error`, blanket retry, or unconditional success/report step that would let a real test failure pass the quality gate.
- Every job/shard publishes its own failure evidence; aggregation merges Allure results without masking a failed shard; job name/summary identifies suite/project/shard/retry status/report location.
- Cache usage has a documented invalidation basis (dependency lockfile hash, browser version) — not an unconditioned cache that can serve stale state.
