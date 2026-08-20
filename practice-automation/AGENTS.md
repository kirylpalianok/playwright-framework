# Playwright Framework Engineering Standard

## 1. Purpose, scope, and authority

This is the mandatory engineering standard for every contributor and AI agent changing this repository. The repository is a production-grade Playwright and TypeScript framework for UI and API verification, Allure reporting, and GitHub Actions execution. Treat it as a shared internal platform for more than 50 automation engineers: every change must be understandable, safe to extend, and inexpensive to operate without tribal knowledge.

The required quality outcome is actionable confidence:

- A passing test proves a meaningful user behaviour or published service contract.
- A failing test identifies the failed operation and includes safe, sufficient diagnostic evidence.
- A result is reproducible from declared configuration and does not depend on execution order, hidden state, or a developer machine.

The following terms are normative:

- **MUST** and **MUST NOT** are mandatory.
- **SHOULD** and **SHOULD NOT** are mandatory unless a documented exception explains the specific trade-off.
- **MAY** is optional.

Apply the most-specific AGENTS.md in the affected directory in addition to this file. A nested file may add requirements or explicitly override a requirement for its directory tree. Checked-in scripts, lockfiles, configuration, and accepted ADRs define the implemented contract. When an accepted ADR conflicts with this standard, follow the ADR and update this document in the same change if the conflict is durable.

## 2. Contribution operating model

Act as a Principal SDET and framework maintainer. Protect reliability, maintainability, security, developer experience, and execution cost together. Do not improve one by silently degrading another.

Before changing code, configuration, workflow, or documentation:

1. Read every applicable AGENTS.md, inspect adjacent implementations, and check the working tree for unrelated changes.
2. State the behaviour to preserve or introduce, the affected architectural boundary, test-data ownership, target environments, and required failure evidence.
3. For multi-step work, maintain a short plan with one active step.
4. Reuse an existing repository convention unless it fails the stated requirement. Do not introduce a new convention, dependency, environment variable, tag, directory, or service without implementing and documenting its contract.
5. Make the smallest cohesive change that solves the root cause. Do not combine opportunistic refactoring with a functional change.
6. Review the diff for dependency direction, parallel safety, secrets, generated artifacts, and unrelated churn. Run the narrowest relevant validation before broader validation.
7. Hand off the change with changed files, observed behaviour, validation run and outcome, assumptions, and unresolved risk.

Never overwrite, discard, or reformat a contributor's unrelated work. Never commit, push, open a pull request, alter remote state, change secrets, or execute a destructive command without explicit instruction.

### Exceptions

An exception is valid only when the change or linked issue records the exact rule, technical reason, scope, owner, risk, mitigation, and removal or review date. An exception MUST be local to the smallest feasible scope. A test title, TODO, code comment without an issue, or global configuration change is not an exception record.

## 3. Engineering principles

- **Behaviour over implementation:** verify observable customer outcomes and published service contracts, not DOM structure, private methods, or incidental response fields.
- **Explicit contracts:** represent inputs, outputs, ownership, timeouts, side effects, and error semantics in types and runtime validation at trust boundaries.
- **Composition over inheritance:** compose focused collaborators. Use inheritance only when one stable mechanism cannot be expressed more clearly through composition and its contract is documented.
- **Stable boundaries:** extract a reusable capability only at an external boundary or after at least two credible consumers demonstrate the same stable need. Otherwise keep the implementation local and explicit.
- **Evidence over containment:** retries, longer timeouts, and quarantines contain known risk; they never prove correctness or close a defect.
- **Secure by default:** assume logs, CI output, artifacts, and test environments are broadly visible. Minimise access and redact sensitive data before it leaves the process.
- **Lowest credible layer:** use domain/unit tests for rules, API tests for service contracts and workflows, and browser tests for critical user journeys or browser-specific risk.

A module MUST have one coherent reason to change. Do not mix UI mechanics, API setup, data generation, reporting, and business assertions in one module. High-level workflows MUST depend on domain contracts and ports, never directly on Playwright, HTTP transport, Allure, process environment, or CI APIs.

## 4. Architecture and dependency policy

Directory names may evolve, but responsibilities and dependency direction MUST remain stable.

~~~
tests/                         executable specifications and suite entry points
src/
  domain/                      business terms, value objects, and invariants
  application/                 workflows and use cases expressed through ports
  ports/                       consumer-focused contracts for external boundaries
  ui/                          Playwright page and component adapters
  api/                         typed service clients and API data mappings
  infrastructure/              concrete configuration, logging, reporting, adapters
  support/                     fixtures, builders, data lifecycle, assertions
  config/                      schema-validated environment configuration
docs/                          ADRs and contributor/operational documentation
.github/workflows/             CI/CD workflows
~~~

| Layer | May depend on | MUST NOT depend on |
| --- | --- | --- |
| domain | TypeScript language features | Playwright, Allure, HTTP clients, Node process APIs, CI APIs, tests |
| ports | domain contracts | adapters, fixtures, reporters, tests |
| application | domain and ports | Playwright, HTTP transport, Allure, configuration loading, tests |
| ui, api, infrastructure | inward contracts and required external libraries | tests; reporting implementation from UI/API adapters |
| support | contracts and concrete adapters needed to compose test scope | production business scenarios, global mutable test state |
| tests | fixtures, workflows, adapters, assertions | reusable browser/HTTP plumbing or a second application layer |

- Support fixtures are the composition root. They MUST construct validated configuration, concrete clients, page/component adapters, test-data lifecycle services, and test-scoped logging.
- Create a port only for an external boundary, a volatile dependency, or a workflow that needs a test double. Do not wrap a trivial local function merely to create a port.
- Keep dependency edges one-way and acyclic. If two layers need a concept, move the contract inward rather than importing outward.
- Do not create catch-all modules or directories named utils, common, helpers, manager, or base. Name each module for its bounded responsibility.
- UI and API adapters MUST NOT create test data, choose an environment, read environment variables, invoke reporters, or perform global cleanup.

Create an ADR in docs/adr before or with a change that alters dependency direction, public extension points, test-data lifecycle, environment model, reporting semantics, retry policy, or CI execution strategy. An ADR MUST state the decision, context, alternatives, consequences, and migration or rollback approach where applicable.

## 5. TypeScript and module policy

- Preserve strict TypeScript. Do not use any, ts-ignore, ts-nocheck, unvalidated type assertions, or non-null assertions to bypass a defect.
- Use unknown only at an untrusted boundary and narrow or schema-validate it immediately. Compile-time declarations do not validate runtime data.
- Use the repository's configured ESM style. Prefer named exports for reusable APIs; use a default export only when the module has one intentional public value and surrounding convention requires it.
- Use interface for exported object contracts and type for unions, mapped types, tuples, and local composition. Export only deliberate public APIs.
- Prefer const, readonly, and immutable data creation. Local mutation is allowed only when its state transition is explicit and contained.
- Model expected alternative outcomes with a discriminated union or explicit result type. Throw only for exceptional or infrastructure failures.
- Use a named options object when an operation has more than two meaningful inputs. Do not use boolean parameters that hide meaning at the call site.
- Await every asynchronous operation, including assertions and cleanup. Do not suppress floating promises.
- Centralise framework timeout classes and domain-significant constants. Do not create constants solely to replace an obvious local literal.
- Document an exported API when its preconditions, side effects, return semantics, or failure modes are not clear from its name and type.

## 6. Configuration, environments, and secrets

- Load configuration in one startup module, validate it once with a runtime schema, and inject the validated object into consumers. No other module may read the process environment.
- Maintain a configuration reference for every variable: name, purpose, required status, safe example, default, sensitivity classification, and applicable environments.
- Fail before test execution when configuration is missing, malformed, contradictory, or unsafe for the selected environment. Errors MUST name the invalid setting but MUST NOT reveal a sensitive value.
- Source code MUST NOT contain credentials, tokens, test-account details, tenant identifiers, or environment URLs. Environment selection may use documented, non-sensitive identifiers only through validated configuration.
- Commit only safe .env.example files. Never commit .env files, browser storage state, or secret-bearing fixtures.
- Treat secrets as write-only: never print, return, serialize, attach, or place them in errors. Recursively redact authorization headers, cookies, passwords, tokens, PII, and sensitive payload fields before logging or attaching evidence.
- Test execution MUST default to a non-production environment. A destructive operation requires an explicit environment allowlist, separate affirmative confirmation setting, idempotent implementation, and documented owner.
- Use short-lived, least-privilege credentials. Persist authenticated browser state only when secure storage, rotation, invalidation, and access controls are documented and implemented.

## 7. Playwright implementation policy

- Use Playwright Test for runner, fixtures, projects, expectations, reporters, tracing, screenshots, and video. Do not build a parallel runner or fixture lifecycle without an approved ADR.
- Each test MUST receive its own BrowserContext, Page, APIRequestContext, mutable account or tenant partition, and generated data unless a documented fixture partitions access safely.
- Locate UI by contract, in this order: getByRole, getByLabel, getByPlaceholder, contractual getByText, then a deliberately named data-testid. Request a testability attribute when none expresses the contract.
- Scope a locator to its meaningful container. Do not use layout/CSS selectors, DOM traversal, generated IDs, XPath, visual coordinates, or nth(). An index is allowed only when position is the behaviour under test.
- A locator used for an action or assertion MUST resolve to one intended element in that state. Treat strict-mode failures as an application or testability defect to resolve.
- Verify every consequential action with a web-first assertion of meaningful UI state. A successful click, fill, or request is not verification.
- Register navigation, popup, download, or event waits before the trigger when the event is contractual, then assert a meaningful destination, file, or state.
- Keep hooks minimal. beforeEach may establish essential shared context only; it MUST NOT perform the business action under test, hide assertions, or make tests order-dependent.

### Page and component objects

Page and component objects are UI adapters: they own private locators, narrow interaction mechanics, and semantic state queries. They do not own business scenarios, cross-boundary setup, test-data creation, reporting decisions, environment selection, or cleanup.

- Name pages and components for UI concepts, for example SignInPage, AccountMenu, and OrderSummaryPanel, and use .page.ts and .component.ts filenames.
- Construct with the narrowest dependency: normally Page for a page and Locator or Page for a component.
- Expose intent-revealing operations and semantic state access. Do not expose generic click, fill, or raw selector APIs.
- Tests own business assertions. Adapters MAY expose semantic locators or value queries, but MUST NOT embed scenario-specific expectations or reporter steps that decide outcomes.
- waitUntilReady() is allowed only for a documented, reusable page invariant and MUST wait for a meaningful observable condition.
- Return another page or component only when that transition is guaranteed. Model validation, permission, or stay-on-page outcomes explicitly.
- Extract a component only when the region is reused or independently meaningful. Do not add one-method element wrappers.

## 8. API and contract-testing policy

- Create APIRequestContext instances through fixtures or typed clients. Centralise base URL, authentication, defaults, timeout class, correlation identifiers, and sanitized request logging at construction.
- Define request and response DTOs explicitly. Validate every untrusted response body before downstream use.
- Every integration-contract test MUST verify status code, contractually relevant headers, runtime response schema, and business outcome. Do not assert incidental fields, unstable ordering, timestamps, or implementation metadata.
- Cover successful, validation, authentication, authorization, absent-resource, conflict, and idempotency behaviours when the published contract defines them.
- Prefer API setup and cleanup for UI prerequisites when it is faster and more deterministic. Retain browser coverage for user-visible behaviour and browser-specific risk.
- Do not call live third-party systems from deterministic CI tests without an approved sandbox, contract test, or virtualization strategy.
- Version critical integration fixtures intentionally and label provider-contract checks separately from end-to-end tests.

## 9. Test design, tags, data, and lifecycle

- Write each test as an executable specification with actor, relevant precondition, action, and observable result. Use Arrange-Act-Assert when it improves clarity.
- A test MUST have one primary behaviour. Multiple assertions are allowed only when together specify that same behaviour.
- Name tests in business language, for example customer submits an order with a valid payment method. Do not use test numbers, framework terms, or should prefixes.
- Use .spec.ts for executable Playwright specifications. Name builders, fixtures, clients, and factories after their domain responsibility.
- Cover equivalence classes, boundaries, state transitions, permissions, and meaningful failures; do not multiply near-identical examples without added risk coverage.
- Tags are execution contracts. The standard tags are @smoke, @regression, @ui, and @api. A new tag requires documentation of owner, selection command, CI use, and coexistence rules.
- Tests MUST pass when run alone, in any order, and in parallel. Serial execution requires an exception record with technical reason, isolated scope, and owner.
- A quarantine MUST link to a tracked issue and include owner, failure evidence, mitigation, and removal date. Do not skip, focus, or indefinitely retry tests.
- Critical UI views and flows MUST include accessibility coverage for keyboard operation and accessible role/name. Use automated rules where configured, but do not represent an automated scan as complete accessibility assurance.

### Test data and cleanup

- Use builders or factories with safe defaults and explicit overrides; do not scatter hand-built payloads or opaque shared fixtures.
- Every mutable record MUST have an owner and a collision-resistant identity containing a run identifier and test identifier. Use synthetic, non-production-like data only.
- Allocate unique accounts or tenant partitions for parallel mutation. If a shared resource is unavoidable, the fixture MUST document the lock or partitioning mechanism and restore the exact owned state.
- Keep setup targeted. Do not seed broad global state to test a narrow behaviour.
- The creator owns cleanup. Run it in fixture teardown or finally, make it idempotent, and preserve the primary failure if cleanup also fails. Surface cleanup failure as supplemental evidence.
- Seed/reset operations MUST be explicit, environment-gated, idempotent, unavailable by default in developer and pull-request execution, and limited to resources owned by the test system.

## 10. Synchronization, timeouts, concurrency, and retries

- Rely on Playwright auto-waiting and web-first assertions. Wait only for the UI, navigation, download, event, or API condition required by the behaviour.
- Fixed delays are prohibited: do not use page.waitForTimeout, setTimeout, sleep helpers, polling without a bounded observable condition, or arbitrary networkidle readiness waits.
- Do not use force: true to bypass actionability. The only exception is a documented browser limitation with a linked issue and an assertion proving the intended effect.
- Define action, assertion, navigation, test, and API timeout classes in central configuration with rationale. A per-test increase requires an exception record proving a legitimately slower contract.
- Treat a timeout as evidence of a selector, synchronization, environment, or product problem. Diagnose that cause before changing a timeout or retry count.
- Set worker count deliberately against account capacity, data isolation, rate limits, and CI resources. A concurrency change MUST evaluate all four.
- Retries are allowed only in CI for classified transient infrastructure failures. Preserve first-retry trace evidence, open or link a flaky-test investigation, and remove the retry when the underlying cause is fixed. Local runs MUST not retry by default.

## 11. Observability, Allure, and errors

- Use one structured logging abstraction with stable fields: run ID, test ID, operation, safe target identifier, elapsed duration, outcome, and causal error where applicable.
- Log lifecycle transitions and diagnostic decisions, not every mechanical interaction. Logs MUST be concise, queryable, and free of secrets and PII.
- Allure results MUST use consistent suite hierarchy and applicable business labels. Apply severity, issue links, and test-case links when the repository taxonomy defines them.
- Create Allure steps for meaningful business operations, not locator wrappers. Attach only sanitized evidence that materially helps diagnosis.
- Configure screenshots on failure and traces on first retry. Enable video only when its diagnostic value justifies storage cost. Document artifact location, access controls, and retention in CI documentation.
- Classify infrastructure failures separately from product failures only using objective, versioned rules. Classification MUST NOT make product failures appear healthy.
- Validate configuration, test data, fixtures, and framework invariants at their boundary and fail with safe, actionable context.
- Catch an error only to recover, run mandatory cleanup, translate a boundary failure, or add material context. Preserve the original error as cause.
- Error messages MUST state failed operation, safe relevant identifiers, expected condition, actual condition when known, and next diagnostic action. Do not swallow errors, return ambiguous sentinels, or branch on error-message text.
- Create a custom error type only when callers have a distinct, legitimate handling path.

## 12. CI/CD and delivery controls

- Workflows MUST use least-privilege permissions, explicit concurrency policy, deterministic Node and Playwright setup, and repository-approved pinned action references. Cache only dependencies or browser assets with a documented invalidation basis.
- Pull-request workflows MUST be non-destructive and safe for forks: install dependencies, run configured formatting/lint/type checks and targeted tests, and publish only safe artifacts. Run broader suites on schedules, protected environments, or manual dispatch as documented.
- Never expose protected credentials to forked pull requests. Gate protected environments and privileged credentials through GitHub environments and explicit approval.
- Every shard MUST publish its own failure evidence. Report aggregation MUST merge Allure results without masking a failed shard. Job name, summary, and failure output MUST identify suite, project, shard, retry status, and report location.
- A real test failure MUST fail its quality gate. Do not use continue-on-error, blanket retries, or unconditional success/report publication to disguise failure.
- Workflow changes MUST assess cache invalidation, artifact retention, matrix and account capacity, rate limits, secrets exposure, and fork safety.
- Add or upgrade a dependency only with compatibility, maintenance, and security rationale. Do not add packages to avoid a small local implementation.

## 13. Documentation, review, and definition of done

Update documentation in the same change when a public extension point, configuration contract, environment safety rule, tag policy, test-data lifecycle, reporting contract, or CI behaviour changes. Keep README.md limited to purpose, prerequisites, setup, common commands, and a successful first run. Record durable architectural decisions in docs/adr.

Before handoff, verify every applicable item:

- The behaviour, acceptance criteria, owner, architectural boundary, and data ownership are clear.
- Dependency direction and module responsibility remain intact; no generic dumping ground or speculative abstraction was added.
- External inputs and API responses are typed and runtime-validated at their boundary.
- Tests are meaningful, isolated, deterministic, parallel-safe, and use semantic locators and observable synchronization.
- Timeouts, retries, force actions, serial execution, skips, and quarantines comply with this standard or have an exception record.
- Setup and cleanup preserve primary failure evidence and do not leak data.
- Logs, Allure metadata, and artifacts are adequately redacted and useful for triage.
- Documentation and ADRs reflect changed contracts.
- The diff contains no credentials, debug output, generated reports, local state, dead code, commented-out code, or unrelated formatting.
- Relevant checks passed. If a check did not run, report the exact command, reason, and residual risk.

Use focused branches and small, coherent Conventional Commits: feat, fix, test, refactor, docs, ci, build, or chore. Pull requests MUST state intent, behavioural impact, validation, environment/security impact, risk, rollback approach when relevant, and follow-up work. Link the tracking issue and Allure evidence when available.

## 14. Explicitly prohibited patterns

Do not introduce any of the following without a valid exception record:

- Fixed sleeps, generalized networkidle waits, hidden force actions, timeout inflation, blanket retries, or catch-and-ignore error handling.
- Selectors based on layout, CSS implementation, DOM depth, generated identifiers, visual coordinates, or incidental text.
- God page objects, inheritance-heavy frameworks, global mutable state, serial suites without isolation, or cross-test dependencies.
- Business actions in hooks, assertions hidden in generic infrastructure, conditionals based on test titles, or test-specific branches in production adapters.
- Untyped boundary data, scattered environment reads, TypeScript escape hatches, hard-coded secrets/environment URLs, PII, or sensitive artifacts.
- Duplicate request/browser wrappers, speculative plugin systems, catch-all utility buckets, one-method abstractions, dead code, or commented-out code.
- Skipped, focused, or quarantined tests without a tracked, owned, time-bound removal plan.

## 15. AI-agent requirements

AI agents MUST inspect before editing, preserve unrelated work, make material assumptions explicit, and use existing scripts and conventions. They MUST diagnose selector, readiness, test-data, environment, and product evidence before changing retries, waits, or assertions. They MUST state validation limits and never claim a command, test, workflow, or integration passed unless it was actually run successfully.
