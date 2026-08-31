# Framework Architecture

This document explains how contributors should extend the Playwright framework. It describes the intent of the current scaffold and the boundaries that future implementation should preserve.

The repository-wide engineering standard is normative and remains in [CLAUDE.md](../CLAUDE.md). This guide is a practical map of the architecture; it does not replace the standard. The ordered implementation plan is maintained in [project-backlog.md](project-backlog.md), and setup commands remain in [README.md](../README.md).

## Architectural principles

### Prefer thin vertical slices

Add a complete, user-observable increment—configuration, fixture composition, adapter, specification, evidence, and validation—before adding a broad framework subsystem. Every backlog story should leave the repository runnable.

### Keep the framework smaller than the application under test

This is an automation framework, not a second implementation of the target application. Use page objects, API clients, components, and builders only where a test has demonstrated a stable need. Do not introduce domain, ports, application, base-page, or generic utility layers speculatively.

### Depend inward through stable contracts

Test specifications express business behavior. UI and API adapters own boundary mechanics. Core modules compose and observe those adapters. A lower-level module must not import a higher-level test scenario to decide what outcome is expected.

### Prove behavior at the lowest credible layer

Use API checks for safe service contracts and network outcomes, browser tests for user-visible behavior and browser-specific risk, and small local builders for test-data rules. Combine UI and API checks when the two observations prove one meaningful behavior.

### Treat isolation and evidence as features

Each test owns its browser context, page, API context, mutable data, and cleanup. A failure must identify the failed operation and retain sanitized evidence. Retries, longer waits, and quarantines do not replace diagnosis.

### Accessibility is part of the contract

Every new UI slice should use accessible roles, names, labels, and keyboard behavior where the target exposes them. A missing accessible contract is a testability gap to record and resolve, not permission to rely on layout selectors.

## Directory responsibilities

The current repository contains the following intentional boundaries:

```text
src/
├── core/
│   ├── config/             startup configuration and runtime validation
│   ├── fixtures/           test composition and lifecycle ownership
│   ├── observability/
│   │   ├── allure/         report metadata and meaningful business steps
│   │   ├── logging/        structured, safe lifecycle logging
│   │   └── redaction/      recursive sanitization of evidence
│   ├── runtime/            run/test identifiers and central timeout classes
│   └── validation/         runtime validation at untrusted boundaries
├── ui/
│   ├── pages/              page-specific Playwright adapters
│   └── components/         independently meaningful or reused UI regions
└── api/
    ├── clients/            typed service clients for proven API consumers
    ├── requests/           the read-only GET/HEAD transport capability
    └── schemas/            response/request runtime schemas

tests/
├── ui/                     browser executable specifications
├── api/                    API and safe network contract specifications
├── accessibility/          cross-cutting specifications, populated only once Story 17 decides enough controls justify a dedicated selection; until then, accessibility checks live inline in tests/ui/
└── test-data/
    ├── builders/           safe scenario data with explicit overrides
    └── lifecycle/          allocation and idempotent cleanup for owned data

docs/
├── adr/                    durable architectural decisions
├── operations/             configuration and operational contracts
└── project-backlog.md      ordered implementation stories
```

Additional repository boundaries are also intentional:

- `playwright.config.ts` defines runner projects and execution defaults. It should remain a composition/configuration entry point, not a business workflow module.
- `.github/workflows/` owns CI orchestration, permissions, artifact handling, and suite selection. It lives at the **repository root**, one level above this project directory, because GitHub Actions only reads workflows from there. Its `run` steps declare `working-directory: practice-automation`, while `uses:` steps resolve paths from the workspace root and carry that prefix explicitly.
- `docs/adr/` is required when a change alters dependency direction, data lifecycle, environment safety, reporting semantics, retries, or CI strategy.
- `package.json` is the source of supported local commands. Do not add ad hoc commands that bypass the configured runner or evidence pipeline.

Empty directories are retained by `.gitkeep` files until their first implementation story adds a real module.

## Dependency rules

The intended dependency direction is:

```text
tests
  ├──> core fixtures/config/observability
  ├──> ui pages/components
  ├──> api clients/schemas
  └──> test-data builders/lifecycle

core fixtures ───> concrete ui/api adapters and core contracts
ui adapters   ───> Playwright and inward contracts
api adapters  ───> HTTP transport, schemas, and inward contracts
core runtime  ───> TypeScript/runtime-only concerns
```

In practical terms:

- Tests may compose adapters and assert outcomes, but must not contain reusable browser or HTTP plumbing.
- `src/ui` may depend on Playwright and inward core contracts, but must not create data, select environments, or invoke reporters directly.
- `src/api` owns typed request/response mapping and boundary validation, but must not own business scenarios or global cleanup.
- `src/core` may compose concrete adapters in fixtures. It must not become a catch-all for application behavior.
- `tests/test-data` may use concrete adapters to allocate and clean up test-owned data, but production adapters must not generate scenario data.
- No module reads `process.env` except the single validated configuration boundary.
- No layer imports from `tests`.
- Avoid circular dependencies. If two inward consumers need a concept, move the smallest contract inward rather than importing outward.

The initial API support is intentionally narrow: a fixture-constructed read-only request capability plus typed schemas. Add a named client only after at least one stable API behavior has a credible second consumer.

## Execution flow

The normal execution path is:

1. A contributor selects a command from `package.json`, such as `npm run test:ui`, `npm run test:api`, or `npm run test:smoke`.
2. Playwright loads `playwright.config.ts`, resolves the configured project, and applies the central test, action, navigation, and assertion timeout classes.
3. The configuration boundary validates the target environment before test execution begins.
4. The fixture composition root creates a test-scoped run/test identifier, browser context, page, API request context, adapters, logger, and cleanup ownership.
5. A specification arranges only the preconditions required for its behavior, invokes intent-revealing page/component/client operations, and owns the primary assertions.
6. UI adapters use semantic locators and observable state. API adapters validate untrusted responses before returning data to the test.
7. Meaningful operations emit sanitized logs and report steps. Diagnostics are attached only when they materially help triage.
8. Teardown runs creator-owned cleanup and preserves the primary failure if cleanup also fails.
9. Playwright publishes configured HTML, screenshots on failure, and traces on first retry. Allure results are written to `allure-results` for later publication/opening.
10. CI preserves each job or shard's evidence and fails the quality gate when a real test fails.

The current bootstrap configuration uses Chromium, Firefox, and WebKit projects, fully parallel execution, no local retries, failure screenshots, first-retry traces, and list/HTML/Allure reporters. Changes to those defaults require evidence and, when durable, an ADR.

## Fixture lifecycle

Fixtures are the composition root, not a place to hide business actions.

### Setup

- Validate configuration once at startup.
- Create a unique run identifier and test identifier.
- Create a fresh `BrowserContext`, `Page`, and API request context for each test unless an explicitly documented fixture safely partitions access.
- Construct only the adapters and data services required by the test scope.
- Start test-scoped structured logging with safe target identifiers.

### Test execution

- The test performs its own business action; hooks may establish essential shared context but must not perform the action under test.
- The test owns primary assertions and determines the expected outcome.
- API setup is preferred for deterministic UI prerequisites when it is safe and the API contract is covered.

### Teardown

- The creator owns cleanup and runs it in teardown or `finally`.
- Cleanup is idempotent and limited to resources owned by that test.
- Cleanup failures are supplemental evidence and must not replace the primary error.
- Browser and API contexts are closed by the fixture lifecycle, even when the test fails.

Do not share mutable accounts, pages, contexts, storage state, or test records across tests unless the partitioning and restoration mechanism is documented and proven parallel-safe.

## Page object philosophy

Page objects are thin UI adapters. A page object should:

- Be named for a recognizable UI page and use a `.page.ts` filename.
- Own private locators and narrow interaction mechanics.
- Expose intent-revealing operations, such as `startCountdown()` or `selectAnimal()`, rather than generic `click()` and `fill()` methods.
- Expose semantic state queries or locators that allow the test to assert the business outcome.
- Use Playwright's auto-waiting and web-first assertions indirectly through observable state queries.
- Return another page/component only when the transition is guaranteed by the UI contract.

Page objects must not:

- Create test data, choose environments, read environment variables, or invoke Allure/reporting APIs.
- Embed scenario-specific expectations that decide whether a test passes.
- Hide navigation, popup, download, or event waits from a test when the event is part of that test's contract.
- Become inheritance hierarchies or generic element wrappers.

Create a component only when a region is independently meaningful or demonstrably reused. The first shared components should be earned through repeated page usage, as described in the backlog; `BasePage`, `DataTable`, `FilePicker`, and site-wide utility abstractions are not default destinations.

## API layer

The API layer has two responsibilities: construct safe typed requests and validate untrusted responses.

- `src/api/requests/` contains the framework's only HTTP request capability: safe `GET` and `HEAD` requests over site-relative paths, with sanitized request/response logging and JSON access gated behind a schema validator. It has no mutation method and no arbitrary-verb escape hatch (see [ADR 0002](adr/0002-read-only-http-request-capability.md)).
- `src/api/clients/` contains named service clients only for stable behaviors with a credible consumer. A client owns request construction, safe defaults, correlation identifiers, response status handling, and mapping to a validated result. None exists yet, by design.
- `src/api/schemas/` contains explicit DTO/runtime schemas for request and response boundaries. Compile-time types alone do not validate server data. Schemas compose the shared JSON boundary helpers in `src/core/validation/`.
- `src/core/fixtures/` constructs API request contexts and injects configuration — base URL, the API timeout class, and the run/test correlation header are applied once, at construction, and the context is disposed with the test. API modules do not read process environment or choose target environments.
- `tests/api/` verifies status, relevant headers, runtime schema, and business or published contract outcome.
- Mutation endpoints require an explicit data owner, collision-resistant identity, idempotent cleanup, and environment safety. Do not add them merely to make UI setup convenient.

For the current public practice target, start with read-only discovery, resource, and download checks. Do not model WordPress implementation endpoints as a business API or submit public contact/comment forms without a sandbox and cleanup contract.

## Observability

Observability exists to shorten diagnosis, not to produce noise.

Use one structured logging abstraction with stable fields such as run ID, test ID, operation, safe target identifier, elapsed duration, outcome, and causal error. Log lifecycle transitions and meaningful business operations; do not log every locator call.

Allure steps should describe operations a contributor or product owner can understand. Apply the repository's suite, severity, issue, and test-case taxonomy consistently. Attach only sanitized evidence that materially explains a failure.

The configured evidence policy is:

- HTML and list output for local feedback.
- Allure results for durable suite reporting.
- Screenshots on failure.
- Traces on the first retry in CI.
- Video off by default until diagnostic value justifies its storage and access cost.
- Recursive redaction of authorization headers, cookies, passwords, tokens, PII, and sensitive payload fields.

Infrastructure classification must be objective and must not convert product failures into a passing result. A retry, when eventually introduced, is CI-only, classified, evidence-preserving, and linked to a removal or flakiness investigation.

## Extension guidelines

Before adding a module, ask:

1. What observable behavior or published contract does it prove?
2. Is this boundary reused or volatile enough to justify an adapter/client/component?
3. Which layer owns the data, configuration, cleanup, assertions, and evidence?
4. Can the test run alone, in any order, and in parallel?
5. What accessible contract and failure evidence will it provide?

When the answer is clear:

- Follow existing filenames and directories: `.page.ts`, `.component.ts`, clients, schemas, builders, lifecycle services, and `.spec.ts` specifications.
- Add the smallest vertical slice that is runnable locally and in the configured CI command.
- Prefer an existing fixture, timeout, tag, logger, redactor, or schema convention over a new one.
- Add a builder for non-trivial or repeated test data; keep one-off simple values local and explicit.
- Update configuration or operational documentation when a public setting, environment rule, data lifecycle, reporting behavior, tag, or CI contract changes.
- Add an ADR before or with durable changes to dependency direction, extension points, retries, environment safety, test-data lifecycle, reporting semantics, or CI execution.
- Review the diff for secrets, generated artifacts, unrelated formatting, hidden waits, selector brittleness, and unused abstractions.

The backlog is the sequencing authority. If implementation reveals that a proposed abstraction has only one consumer or that the target lacks a stable contract, keep the test local, record the testability gap, and defer extraction rather than forcing the architecture to match the plan.
