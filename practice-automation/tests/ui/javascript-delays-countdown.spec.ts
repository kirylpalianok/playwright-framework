import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata } from '../../src/core/observability/allure/suite-metadata.js';

// The target's countdown runs ten one-second ticks after the Start button is clicked,
// then replaces the countdown text with "Liftoff!" (see the page's own `delayFunc()`).
// Measured directly against the target, the click-to-"Liftoff!" delay is consistently
// ~10.0-10.1s. This is a known, deterministic product delay rather than a flaky
// condition, so the assertion below overrides only its own timeout — with a safety
// margin for slower CI runs — to outlast that delay; it still polls the DOM through
// Playwright's web-first assertion and returns as soon as the text appears, instead of
// waiting a fixed duration or inflating the shared per-test/expectation timeout classes.
const LIFTOFF_ASSERTION_TIMEOUT_MS = 15_000;

test.describe('JavaScript delay countdown', () => {
  test(
    'a visitor starts the countdown and observes the Liftoff outcome',
    { tag: ['@ui', '@regression'] },
    async ({ javascriptDelaysPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'JavaScript Delays',
        subSuiteName: 'Countdown',
        featureName: 'Dynamic Client-Side State',
        storyName: 'Verify JavaScript delay completion without fixed waits',
      });

      const startedAt = Date.now();

      await test.step('open the JavaScript Delays exercise', async () => {
        await javascriptDelaysPage.open();
      });

      await expect(page.getByRole('heading', { name: 'JavaScript Delays', level: 1 })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();

      await test.step('start the countdown', async () => {
        await javascriptDelaysPage.startCountdown();
      });

      await expect(javascriptDelaysPage.liftoffMessage()).toBeVisible({ timeout: LIFTOFF_ASSERTION_TIMEOUT_MS });

      logger.logOperation({
        operation: 'javascript-delay-countdown',
        target: '/javascript-delays/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );
});
