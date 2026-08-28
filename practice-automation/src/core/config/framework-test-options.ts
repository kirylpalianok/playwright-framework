/**
 * Playwright test options the runner carries from the single configuration boundary into
 * the fixture scope. `playwright.config.ts` sets them from the validated
 * `EnvironmentConfig`, and fixtures consume them like any other Playwright option, so no
 * module besides `environment.ts` ever reads `process.env` (CLAUDE.md section 6).
 *
 * Add an option here only when a validated setting must reach a test-scoped fixture that
 * Playwright's built-in options (`baseURL`, `actionTimeout`, and similar) do not cover.
 */
export interface FrameworkTestOptions {
  /** Central API request timeout class, applied when a fixture builds a request context. */
  readonly apiRequestTimeoutMs: number;
}
