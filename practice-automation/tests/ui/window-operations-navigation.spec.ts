import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata } from '../../src/core/observability/allure/suite-metadata.js';
import type { WindowOperation } from '../../src/ui/pages/window-operations.page.js';

const EXERCISE_PATH = '/window-operations/';
const FEATURE_NAME = 'Browser Page Lifecycle';
const STORY_NAME = 'Verify new page and replacement navigation';

// The destination all three triggers open. It is a fixed part of the exercise's published
// content — the address the page's own script navigates to — and not a configurable
// environment for this framework to target, so it belongs in the specification that
// asserts it rather than in the validated configuration boundary.
//
// The assertions stay on the two contracts of that destination that are stable enough to
// gate a test on: its origin, and its brand name in the document title. `www.` and the
// trailing slash are both accepted because the site redirects between those forms, and
// the title's marketing tagline is deliberately not asserted.
//
// These specifications therefore depend on a site this framework does not own. They carry
// `@ui @regression` and no `@smoke` tag, which keeps them out of the pull-request quality
// gate, so an outage of that destination cannot block a pull request.
const DESTINATION_URL = /^https:\/\/(www\.)?automatenow\.io\/?$/;
const DESTINATION_TITLE = /automateNow/i;

/** How the visitor activates a trigger, and how a test title reads that route. */
type ActivationRoute = 'mouse' | 'keyboard';

const ACTIVATION_DESCRIPTIONS: Readonly<Record<ActivationRoute, string>> = {
  mouse: 'with the mouse',
  keyboard: 'from the keyboard',
};

/** One trigger that opens the destination in a page of its own, and how to report it. */
interface NewPageScenario {
  readonly operation: WindowOperation;
  /** The trigger's expected accessible name, stated here as the test's own expectation. */
  readonly triggerName: string;
  /** How a visitor would describe the page the browser opens. */
  readonly openedPageDescription: string;
  readonly activation: ActivationRoute;
  readonly loggedOperation: string;
}

// Two of the exercise's triggers open a new page, and they are separate `window.open`
// calls: one takes the browser's default target, the other names `_blank` and passes
// window features. Playwright surfaces both as the same popup event, but a regression in
// either call — a changed target most of all — would be invisible if only one were
// covered, so each is its own focused specification over one shared test body.
//
// The two are also activated by different routes, which is what proves these triggers are
// operable without a pointer. One route each is enough: the buttons share one markup and
// one event mechanic, so a second keyboard leg would repeat a proven contract rather than
// cover new risk.
const NEW_PAGE_SCENARIOS: readonly NewPageScenario[] = [
  {
    operation: 'new-tab',
    triggerName: 'New Tab',
    openedPageDescription: 'a new browser tab',
    activation: 'mouse',
    loggedOperation: 'window-operations-new-tab-opened',
  },
  {
    operation: 'new-window',
    triggerName: 'New Window',
    openedPageDescription: 'a new browser window',
    activation: 'keyboard',
    loggedOperation: 'window-operations-new-window-opened',
  },
];

test.describe('Window operation navigation', () => {
  for (const scenario of NEW_PAGE_SCENARIOS) {
    test(
      `a visitor opens the destination in ${scenario.openedPageDescription} ${ACTIVATION_DESCRIPTIONS[scenario.activation]} and keeps the exercise page open`,
      { tag: ['@ui', '@regression'] },
      async ({ windowOperationsPage, page, logger }) => {
        await applySuiteMetadata({
          layer: 'UI',
          suiteName: 'Window Operations',
          subSuiteName: scenario.triggerName,
          featureName: FEATURE_NAME,
          storyName: STORY_NAME,
        });

        const startedAt = Date.now();

        await test.step('open the Window Operations exercise', async () => {
          await windowOperationsPage.open();
        });

        const trigger = windowOperationsPage.operationTrigger(scenario.operation);
        await expect(trigger).toBeVisible();
        await expect(trigger).toHaveAccessibleName(scenario.triggerName);

        // Registered before the trigger is activated: the browser opens the page as a
        // direct result of that activation, so a wait started afterwards could miss the
        // event it is meant to observe.
        const openedPage = page.waitForEvent('popup');

        await test.step(
          `activate the ${scenario.triggerName} trigger ${ACTIVATION_DESCRIPTIONS[scenario.activation]}`,
          async () => {
            if (scenario.activation === 'keyboard') {
              await trigger.focus();
              await expect(trigger).toBeFocused();
              await page.keyboard.press('Enter');
              return;
            }

            await windowOperationsPage.requestOperation(scenario.operation);
          },
        );

        const destinationPage = await openedPage;

        // The destination the opened page settles on is the behaviour under test; the
        // existence of a second `Page` object alone would prove nothing about where the
        // visitor was taken.
        await expect(destinationPage).toHaveURL(DESTINATION_URL);
        await expect(destinationPage).toHaveTitle(DESTINATION_TITLE);

        // What separates opening a page from replacing one: the exercise the visitor
        // started on is still there, unchanged, behind the page that just opened.
        await expect(page).toHaveURL(EXERCISE_PATH);

        // The test opened this page, so the test closes it. The context is this test's
        // own and is disposed by the fixture lifecycle even when an assertion above
        // fails, so no opened page can reach a later test either way.
        await destinationPage.close();

        logger.logOperation({
          operation: scenario.loggedOperation,
          target: EXERCISE_PATH,
          outcome: 'success',
          durationMs: Date.now() - startedAt,
          details: { trigger: scenario.triggerName, activation: scenario.activation },
        });
      },
    );
  }

  test(
    'a visitor replaces the exercise page with the destination in the same tab',
    { tag: ['@ui', '@regression'] },
    async ({ windowOperationsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Window Operations',
        subSuiteName: 'Replace Window',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Window Operations exercise', async () => {
        await windowOperationsPage.open();
      });

      const trigger = windowOperationsPage.operationTrigger('replace-window');
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAccessibleName('Replace Window');

      // Proving the visitor starts on the exercise is what makes the assertions after the
      // click evidence that this page was replaced, rather than of where it already was.
      await expect(page).toHaveURL(EXERCISE_PATH);

      await test.step('activate the Replace Window trigger', async () => {
        await windowOperationsPage.requestOperation('replace-window');
      });

      await expect(page).toHaveURL(DESTINATION_URL);
      await expect(page).toHaveTitle(DESTINATION_TITLE);

      // Replacement, not addition: the visitor is left with the one page they started
      // with, which is what distinguishes this trigger from the two above it.
      //
      // A snapshot is sound here rather than a retrying assertion. Had the trigger opened
      // a page instead of navigating this one, the browser would have reported that page
      // before it reported the navigation the assertions above already awaited, so an
      // extra page would be listed by now.
      expect(page.context().pages()).toEqual([page]);

      logger.logOperation({
        operation: 'window-operations-page-replaced',
        target: EXERCISE_PATH,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
        details: { trigger: 'Replace Window', activation: 'mouse' },
      });
    },
  );
});
