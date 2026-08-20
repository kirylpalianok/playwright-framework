import { test as base, expect } from '@playwright/test';
// Registers allure-playwright's test runtime for this worker process. Required because
// allure-js-commons only auto-detects the newer unified "playwright" test runner; under
// the classic `@playwright/test` runner used here, the runtime must be registered
// explicitly before any allure-js-commons label/step call, or those calls silently
// no-op (see docs/adr/0001-bootstrap-environment-configuration-and-pull-request-ci.md).
import 'allure-playwright/autoconfig';
import { createRunId } from '../runtime/identifiers.js';
import { createLogger, type Logger } from '../observability/logging/structured-logger.js';
import { PracticeCatalogPage } from '../../ui/pages/practice-catalog.page.js';
import { JavaScriptDelaysPage } from '../../ui/pages/javascript-delays.page.js';

interface FrameworkWorkerFixtures {
  /** One identifier shared by every test this worker process runs. */
  runId: string;
}

interface FrameworkTestFixtures {
  logger: Logger;
  catalogPage: PracticeCatalogPage;
  javascriptDelaysPage: JavaScriptDelaysPage;
}

/**
 * The framework's composition root. Constructs the run identifier, test-scoped
 * structured logger, and UI page adapters that specifications depend on, so tests never
 * wire up this plumbing themselves.
 */
export const test = base.extend<FrameworkTestFixtures, FrameworkWorkerFixtures>({
  runId: [
    async ({}, use) => {
      await use(createRunId());
    },
    { scope: 'worker' },
  ],

  logger: async ({ runId }, use, testInfo) => {
    await use(createLogger({ runId, testId: testInfo.testId }));
  },

  catalogPage: async ({ page }, use) => {
    await use(new PracticeCatalogPage(page));
  },

  javascriptDelaysPage: async ({ page }, use) => {
    await use(new JavaScriptDelaysPage(page));
  },
});

export { expect };
