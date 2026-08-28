# Project Backlog

This backlog is the ordered implementation plan for the boundaries described in [architecture.md](architecture.md) and the repository-wide standard in [CLAUDE.md](../CLAUDE.md). Complete stories in epic order and honor each story's stated dependencies; do not start a later epic's stories before its dependencies are done.

Tagging convention: unless a story states otherwise, every UI specification carries `@ui @regression` and every API specification carries `@api @regression`. `@smoke` is reserved for the narrow slice proven in Story 1. A story that needs a different or additional tag states so explicitly, as Stories 1 and 3 do.

## Epic 1 — Thin Cross-Layer Foundation

### Story 1 — Run the first UI and API smoke slice in CI

- Objective: Establish the smallest end-to-end framework slice: validated configuration, one catalogue navigation test, one safe API discovery test, actionable reporting, and automated pull-request validation.
- Implementation Tasks:
  - [x] Add one schema-validated startup configuration boundary for the target base URL and timeout classes.
  - [x] Update the configuration reference and safe environment template.
  - [x] Create test-scoped UI and API fixtures with a run identifier and sanitized structured logging.
  - [x] Implement `PracticeCatalogPage` only for opening the catalogue and following a named exercise link.
  - [x] Add one `@smoke @ui` specification for catalogue navigation to JavaScript Delays.
  - [x] Add one `@smoke @api` specification that validates the public REST discovery endpoint's status, relevant header, and small runtime schema.
  - [x] Apply the initial Allure suite hierarchy and labels to both specifications.
  - [x] Create a least-privilege GitHub Actions pull-request workflow that runs typecheck and the smoke suite and publishes safe failure evidence.
- Acceptance Criteria: A configured local run and a pull request run execute one meaningful UI behavior and one meaningful HTTP contract check; each result is distinguishable in Allure.
- Definition of Done: `npm run check` and the targeted smoke commands pass; configuration failure is safe and actionable; CI does not require credentials or mutable test data; no environment URL is embedded in test or framework source.
- Dependencies: None.
- Estimated Complexity: L
- Notes: Keep the initial API test narrow. This proves API support without introducing a generic HTTP wrapper or a WordPress-specific client.

## Epic 2 — Observable UI State

### Story 2 — Verify JavaScript delay completion without fixed waits

- Objective: Prove the framework synchronizes on meaningful client-side state.
- Implementation Tasks:
  - [x] Implement `JavaScriptDelaysPage` with a semantic start operation and liftoff state query.
  - [x] Add a regression specification that starts the countdown and verifies the visible Liftoff outcome.
  - [x] Add accessible role/name checks for the trigger and destination heading.
  - [x] Add meaningful Allure steps and safe diagnostic context for the countdown operation.
- Acceptance Criteria: The test passes using Playwright auto-waiting and web-first assertions only.
- Definition of Done: The test passes alone, in the smoke/regression selection, and in CI; no fixed delay, `networkidle`, force action, or per-test timeout increase is introduced.
- Dependencies: Story 1.
- Estimated Complexity: S
- Notes: This is the reference pattern for dynamic-state tests.

## Epic 3 — Safe Form State and Read-Only API Requests

### Story 3 — Exercise form controls without submitting public data

- Objective: Support deterministic form interaction while avoiding public form side effects.
- Implementation Tasks:
  - [x] Implement `FormFieldsPage` for semantic form interaction and selected-value queries.
  - [x] Add a synthetic form-value builder with explicit safe overrides.
  - [x] Add coverage for required text input, password, checkbox group, radio group, select, email, and message state.
  - [x] Add accessible label, required-state, and keyboard interaction checks for supported controls.
  - [x] Tag the specifications as `@ui @regression` and preserve existing reporting conventions.
- Acceptance Criteria: Tests prove control state and validation behavior without sending a contact, comment, or email-producing form.
- Definition of Done: Tests pass alone and in parallel; all input is synthetic and non-PII; no cleanup is necessary because no remote data is created.
- Dependencies: Story 1.
- Estimated Complexity: M
- Notes: Use documented test IDs only when a unique accessible contract is unavailable.

### Story 4 — Add a narrow safe GET and HEAD API capability

- Objective: Make repeatable read-only API checks available to future UI-plus-network tests.
- Implementation Tasks:
  - [x] Add a typed, fixture-constructed capability for public GET and HEAD requests.
  - [x] Centralize base URL, correlation data, timeout, and sanitized request/response logging at construction.
  - [x] Add runtime validation helpers for JSON response boundaries.
  - [x] Refactor the API smoke test from Story 1 to use the new capability.
  - [x] Add one read-only API regression check with status, relevant headers, schema, and observable purpose.
- Acceptance Criteria: API tests can make safe read requests with consistent diagnostics and no direct environment access outside validated configuration.
- Definition of Done: Existing API smoke coverage still passes; malformed JSON or unexpected status produces actionable, sanitized evidence; no catch-all API client or mutation method is added.
- Dependencies: Story 1.
- Estimated Complexity: M
- Notes: Do not model WordPress internals as a business API. Add only the capability required by current tests.

## Epic 4 — Focused Interaction Specifications

### Story 5 — Verify click-event feedback

- Objective: Establish a compact pattern for event-to-visible-result behavior.
- Implementation Tasks:
  - [ ] Implement `ClickEventsPage` with named animal-selection operations and result-state access.
  - [ ] Add one specification that selects an animal and verifies its displayed result.
  - [ ] Verify the selected control has a usable accessible name.
- Acceptance Criteria: The test proves a user action causes the intended visible response.
- Definition of Done: The specification runs independently and in parallel, uses no generic click abstraction, and produces normal Allure/failure evidence.
- Dependencies: Story 1.
- Estimated Complexity: S
- Notes: Add only one representative equivalence class unless additional choices expose distinct risk.

### Story 6 — Verify accordion behavior by mouse and keyboard

- Objective: Cover an expandable interaction and its accessibility contract.
- Implementation Tasks:
  - [ ] Implement `AccordionPage` with expand and panel-state operations.
  - [ ] Add a specification for expanding the accordion and observing its content.
  - [ ] Add keyboard operation and accessible role/name/state checks where exposed by the target.
- Acceptance Criteria: The expanded content and accessible state agree after the user interaction.
- Definition of Done: The test is independent, uses semantic locators, and does not rely on styling classes or DOM traversal.
- Dependencies: Story 1.
- Estimated Complexity: S
- Notes: Record an explicit testability gap if the target lacks an accessible contract; do not bypass policy with CSS selectors.

## Epic 5 — Browser-Owned Events and Overlays

### Story 7 — Handle browser dialogs deterministically

- Objective: Cover alert, confirm, and prompt behavior through Playwright's dialog boundary.
- Implementation Tasks:
  - [ ] Implement `PopupsPage` with semantic triggers for alert, confirm, and prompt scenarios.
  - [ ] Add one focused specification for each dialog type, registering the handler before the trigger.
  - [ ] Assert the user-visible consequence for confirm and prompt outcomes where the page exposes one.
- Acceptance Criteria: Dialog acceptance/dismissal and prompt input are deterministic and do not leak handlers between tests.
- Definition of Done: All dialog tests pass in isolation and parallel execution; traces identify dialog type and chosen outcome.
- Dependencies: Story 1.
- Estimated Complexity: M
- Notes: Dialog handlers belong in the test/fixture boundary, not inside the page adapter.

### Story 8 — Verify new page and replacement navigation

- Objective: Exercise browser page lifecycle events as observable user behavior.
- Implementation Tasks:
  - [ ] Implement `WindowOperationsPage` with triggers for new tab, new window, and replacement navigation.
  - [ ] Add a new-page test that registers the popup wait before clicking and verifies a meaningful destination.
  - [ ] Add a replacement-navigation test that verifies the original page's resulting URL/title/state.
  - [ ] Add accessible-name checks for the navigation triggers.
- Acceptance Criteria: Tests prove the intended destination behavior rather than merely detecting a new `Page` object.
- Definition of Done: Tests run with isolated browser contexts and leave no open-page state shared with later tests.
- Dependencies: Story 1.
- Estimated Complexity: M
- Notes: Keep external destination assertions limited to stable URL/title contracts.

### Story 9 — Add modal behavior and extract a dialog component only if earned

- Objective: Cover reusable overlay behavior without creating a speculative component library.
- Implementation Tasks:
  - [ ] Add a modal specification for visible state, accessible dialog name, and close behavior.
  - [ ] Add focus behavior checks where the target implementation supports them.
  - [ ] Extract `ModalDialog` only if at least two modal scenarios require the same stable mechanics.
- Acceptance Criteria: A user can open and close the modal, and the dialog is observable through an accessible contract.
- Definition of Done: The test does not submit the global modal form; any extracted component has at least two demonstrated consumers.
- Dependencies: Story 7.
- Estimated Complexity: M
- Notes: Ad-delivered overlays are out of scope for this story because ad blockers and delivery are volatile.

## Epic 6 — Evidence-Based Shared UI and File Downloads

### Story 10 — Extract breadcrumb navigation after repeated use

- Objective: Introduce the first shared UI component only after repeated test evidence.
- Implementation Tasks:
  - [ ] Confirm at least three implemented pages use the same breadcrumb interaction/state contract.
  - [ ] Extract `Breadcrumbs` with a semantic current-page query and Home navigation operation.
  - [ ] Refactor existing page adapters to compose the component without changing test behavior.
- Acceptance Criteria: Existing navigation tests retain their behavior while repeated breadcrumb mechanics have one owner.
- Definition of Done: All affected tests pass unchanged at specification level; no `BasePage` or generic site-shell abstraction is introduced.
- Dependencies: Stories 2, 3, and 6.
- Estimated Complexity: S
- Notes: Do not extract the global header, footer, or search overlay until a second credible consumer needs their mechanics.

### Story 11 — Verify normal file download through UI and HTTP evidence

- Objective: Demonstrate a safe UI-plus-API file contract.
- Implementation Tasks:
  - [ ] Implement `FileDownloadPage` for the normal download trigger.
  - [ ] Add a test that registers the download wait before the action and verifies the download metadata.
  - [ ] Use the read-only API capability to validate the corresponding response status and relevant headers.
  - [ ] Add accessible-name coverage for the download trigger.
- Acceptance Criteria: The browser interaction and HTTP response both prove the normal download is available to a user.
- Definition of Done: Download artifacts remain inside Playwright-owned output; no password-protected download credential is added to source or logs.
- Dependencies: Story 4.
- Estimated Complexity: M
- Notes: Extract `DownloadCard` only when both download choices need the same stable interaction contract.

## Epic 7 — Tables and Explicit Negative Resource Contracts

### Story 12 — Verify table content using semantic structure

- Objective: Add structured-content coverage without positional selectors.
- Implementation Tasks:
  - [ ] Implement `TablesPage` with table, header, and named-row access.
  - [ ] Add one simple-table content test and one meaningful sortable/paginated-table behavior test if the user-visible contract is stable.
  - [ ] Add table semantics and accessible-header checks.
- Acceptance Criteria: Tests locate data through headers and row identity and verify customer-visible values.
- Definition of Done: No `nth()`, DOM traversal, incidental order assertion, or CSS-layout selector is used.
- Dependencies: Story 1.
- Estimated Complexity: M
- Notes: Do not extract a generic `DataTable` unless another page demonstrates the same stable need.

### Story 13 — Verify documented broken resources as negative contracts

- Objective: Show that the framework can validate intentional failure scenarios without masking them.
- Implementation Tasks:
  - [ ] Add a UI-plus-request test for the documented broken link and expected `404` response.
  - [ ] Add working-image and intentionally broken-image checks with explicit expected statuses.
  - [ ] Add safe diagnostics that identify the resource URL/path without attaching unrelated page content.
- Acceptance Criteria: Expected broken resources pass as negative specifications, while unexpected status changes fail visibly.
- Definition of Done: Tests use no retries to conceal status failures and preserve first-failure evidence.
- Dependencies: Story 4.
- Estimated Complexity: M
- Notes: These are training-site contracts, not assertions that every page resource must return `200`.

## Epic 8 — Advanced Interactions and Testability-Gated Coverage

### Story 14 — Add slider and calendar coverage where semantic controls exist

- Objective: Extend UI coverage to value-based controls while keeping accessible contracts primary.
- Implementation Tasks:
  - [ ] Assess the slider and calendar controls for usable role, name, and state contracts.
  - [ ] Implement page adapters only for controls that meet the assessment.
  - [ ] Add one slider value-change test and one deterministic date-selection/entry test.
  - [ ] Add keyboard and accessible-value assertions where supported.
- Acceptance Criteria: Each test verifies the displayed/selected value through a semantic UI contract.
- Definition of Done: Tests pass without coordinate interactions, CSS selectors, or date-dependent flakiness; unsupported controls are recorded as testability gaps.
- Dependencies: Story 1.
- Estimated Complexity: M
- Notes: Use deterministic dates and do not create a generic calendar component from one page.

### Story 15 — Assess and selectively automate remaining advanced exercises

- Objective: Make an explicit, evidence-based decision for iframe, hover, spinner, gestures, upload, and ad scenarios.
- Implementation Tasks:
  - [ ] Assess each exercise for semantic locators, external dependency, data mutation, cleanup ownership, and CI reliability.
  - [ ] Implement only self-contained, compliant scenarios that have a meaningful observable result.
  - [ ] Document excluded scenarios and the exact testability or lifecycle blocker.
  - [ ] Keep third-party maps, external iframe destinations, ad delivery, and persistent upload behavior out of pull-request quality gates unless an owned contract exists.
- Acceptance Criteria: Every implemented advanced test meets the same synchronization, data, and accessibility rules as earlier stories.
- Definition of Done: The repository remains runnable; no unsupported scenario introduces prohibited selectors, fixed waits, unowned server data, or a hidden quarantine.
- Dependencies: Stories 4, 7, and 14.
- Estimated Complexity: L
- Notes: This story may produce several small test additions, but each candidate must be independently accepted or declined before implementation.

## Epic 9 — Production Readiness and CI Maturity

### Story 16 — Strengthen reporting, redaction, and operational documentation

- Objective: Make all existing test results useful and safe for team-scale triage.
- Implementation Tasks:
  - [ ] Standardize Allure suite hierarchy, labels, severity, and business-operation steps across implemented tests.
  - [ ] Complete recursive redaction for request/response logging and failure attachments.
  - [ ] Document artifact locations, access expectations, retention, tags, and external-target limitations.
  - [ ] Verify screenshots on failure and traces on first retry are correctly configured.
- Acceptance Criteria: A failing UI or API test provides sufficient diagnostic evidence without exposing credentials, tokens, or form values that should remain private.
- Definition of Done: Existing suites pass; a controlled failing local run demonstrates sanitized evidence; documentation matches implemented behavior.
- Dependencies: Stories 1 through 15.
- Estimated Complexity: M
- Notes: Do not add video by default unless evidence demonstrates its diagnostic value exceeds storage cost.

### Story 17 — Expand CI selection and enforce framework quality gates

- Objective: Scale automated validation without turning a public external target into a flaky pull-request gate.
- Implementation Tasks:
  - [ ] Define documented smoke, UI, API, and regression command selection in CI.
  - [ ] Keep stable, self-contained tests in pull-request validation and schedule/manual-dispatch broader external-dependency coverage.
  - [ ] Add per-job artifact publication and result summaries that preserve failed-job status.
  - [ ] Evaluate browser matrix, workers, and sharding against target stability and CI capacity before enabling them.
  - [ ] Add CI-only retries only if a classified transient failure has evidence, ownership, and removal plan.
  - [ ] Decide whether enough implemented controls now justify a dedicated `@accessibility` selection backed by `tests/accessibility/`; if so, add it and document the command, otherwise record why story-level inline checks remain sufficient.
- Acceptance Criteria: Pull requests receive fast, deterministic feedback; broader coverage remains visible and cannot be reported as healthy when a test fails.
- Definition of Done: Workflow permissions, concurrency, cache behavior, artifact retention, and fork safety are documented and validated; no `continue-on-error`, blanket retry, or unconditional success path exists.
- Dependencies: Stories 1 through 16.
- Estimated Complexity: L
- Notes: Accessibility remains part of every UI story; add a focused accessibility selection only after enough critical controls exist to justify it.
