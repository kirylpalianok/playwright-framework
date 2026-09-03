import { test as base, expect } from '@playwright/test';
// Registers allure-playwright's test runtime for this worker process. Required because
// allure-js-commons only auto-detects the newer unified "playwright" test runner; under
// the classic `@playwright/test` runner used here, the runtime must be registered
// explicitly before any allure-js-commons label/step call, or those calls silently
// no-op (see docs/adr/0001-bootstrap-environment-configuration-and-pull-request-ci.md).
import 'allure-playwright/autoconfig';
import { createRunId } from '../runtime/identifiers.js';
import { createLogger, type Logger } from '../observability/logging/structured-logger.js';
import { DEFAULT_TIMEOUTS } from '../config/environment.js';
import type { FrameworkTestOptions } from '../config/framework-test-options.js';
import {
  createReadOnlyHttpRequests,
  type ReadOnlyHttpRequests,
} from '../../api/requests/read-only-http-requests.js';
import { PracticeCatalogPage } from '../../ui/pages/practice-catalog.page.js';
import { JavaScriptDelaysPage } from '../../ui/pages/javascript-delays.page.js';
import { FormFieldsPage } from '../../ui/pages/form-fields.page.js';
import { ClickEventsPage } from '../../ui/pages/click-events.page.js';
import { AccordionPage } from '../../ui/pages/accordion.page.js';
import { PopupsPage } from '../../ui/pages/popups.page.js';
import { WindowOperationsPage } from '../../ui/pages/window-operations.page.js';
import { ModalsPage } from '../../ui/pages/modals.page.js';

interface FrameworkWorkerFixtures {
  /** One identifier shared by every test this worker process runs. */
  runId: string;
}

interface FrameworkTestFixtures {
  logger: Logger;
  /**
   * The configured target's base URL, proven present at the fixture boundary. Tests use
   * it to build an absolute resource URL when a contract requires one, so no
   * specification embeds an environment URL of its own.
   */
  targetBaseUrl: string;
  readOnlyRequests: ReadOnlyHttpRequests;
  catalogPage: PracticeCatalogPage;
  javascriptDelaysPage: JavaScriptDelaysPage;
  formFieldsPage: FormFieldsPage;
  clickEventsPage: ClickEventsPage;
  accordionPage: AccordionPage;
  popupsPage: PopupsPage;
  windowOperationsPage: WindowOperationsPage;
  modalsPage: ModalsPage;
}

/**
 * The framework's composition root. Constructs the run identifier, test-scoped structured
 * logger, the read-only HTTP request capability and the `APIRequestContext` whose
 * lifecycle it owns, and the UI page adapters that specifications depend on, so tests
 * never wire up this plumbing themselves.
 */
export const test = base.extend<FrameworkTestFixtures & FrameworkTestOptions, FrameworkWorkerFixtures>({
  // Playwright requires a default for every option. It is taken from the same constant
  // the configuration boundary falls back to, so a config that omits the option cannot
  // diverge from a config that sets it while `API_TIMEOUT_MS` is unset.
  apiRequestTimeoutMs: [DEFAULT_TIMEOUTS.apiRequestMs, { option: true }],

  runId: [
    async ({}, use) => {
      await use(createRunId());
    },
    { scope: 'worker' },
  ],

  logger: async ({ runId }, use, testInfo) => {
    await use(createLogger({ runId, testId: testInfo.testId }));
  },

  targetBaseUrl: async ({ baseURL }, use) => {
    if (baseURL === undefined) {
      throw new Error(
        'Cannot resolve the target base URL: none is configured. Expected: playwright.config.ts to set `use.baseURL` from the validated environment configuration. Next step: check src/core/config/environment.ts and playwright.config.ts.',
      );
    }

    await use(baseURL);
  },

  /**
   * Builds this test's own read-only request context, applying the validated base URL,
   * the central API timeout class, and a correlation header that ties every request back
   * to the run and test that issued it. The context is disposed with the test, so no
   * connection or cookie state crosses into another test.
   */
  readOnlyRequests: async ({ playwright, targetBaseUrl, apiRequestTimeoutMs, runId, logger }, use, testInfo) => {
    const requestContext = await playwright.request.newContext({
      baseURL: targetBaseUrl,
      timeout: apiRequestTimeoutMs,
      extraHTTPHeaders: { 'x-correlation-id': `${runId}/${testInfo.testId}` },
    });

    try {
      await use(createReadOnlyHttpRequests({ request: requestContext, logger }));
    } finally {
      await requestContext.dispose();
    }
  },

  catalogPage: async ({ page }, use) => {
    await use(new PracticeCatalogPage(page));
  },

  javascriptDelaysPage: async ({ page }, use) => {
    await use(new JavaScriptDelaysPage(page));
  },

  formFieldsPage: async ({ page }, use) => {
    await use(new FormFieldsPage(page));
  },

  clickEventsPage: async ({ page }, use) => {
    await use(new ClickEventsPage(page));
  },

  accordionPage: async ({ page }, use) => {
    await use(new AccordionPage(page));
  },

  popupsPage: async ({ page }, use) => {
    await use(new PopupsPage(page));
  },

  windowOperationsPage: async ({ page }, use) => {
    await use(new WindowOperationsPage(page));
  },

  modalsPage: async ({ page }, use) => {
    await use(new ModalsPage(page));
  },
});

export { expect };
