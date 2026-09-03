import type { Page } from '@playwright/test';
import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata } from '../../src/core/observability/allure/suite-metadata.js';
import type { PromptOutcomeMessage } from '../../src/ui/pages/popups.page.js';

const EXERCISE_PATH = '/popups/';
const FEATURE_NAME = 'Browser Dialogs';
const STORY_NAME = 'Handle browser dialogs deterministically';

/** The messages the exercise's dialogs carry, which identify the dialog a visitor is answering. */
const ALERT_MESSAGE = 'Hi there, pal!';
const CONFIRM_MESSAGE = 'OK or Cancel, which will it be?';
const PROMPT_MESSAGE = "Hi there, what's your name?";

// Synthetic, non-PII input for the prompt: the exercise only echoes it back into the
// greeting, so the name needs to be recognizable in evidence, not realistic.
const VISITOR_NAME = 'Practice Visitor';
const PROMPT_GREETING: PromptOutcomeMessage = `Nice to meet you, ${VISITOR_NAME}!`;

/** The answer a visitor gives to a browser dialog. */
type DialogAnswer =
  | { readonly action: 'accept'; readonly promptText?: string }
  | { readonly action: 'dismiss' };

/** What an answered dialog reported about itself, so the test can assert which one it was. */
interface AnsweredDialog {
  readonly type: string;
  readonly message: string;
}

/**
 * Registers a one-shot handler for the next dialog the page raises, answers it as the
 * caller asked, and resolves with what that dialog reported about itself.
 *
 * This lives in the specification rather than in `PopupsPage` because the dialog belongs
 * to the browser and the answer given to it is the behaviour under test. `page.once` is
 * what bounds the handler to the single action it was registered for, and the fixtures
 * give every test its own `Page`, so no handler can outlive its test or reach another one.
 *
 * Register before triggering the dialog: an unanswered dialog blocks the page, so the
 * handler must already exist when the dialog opens.
 */
function answerNextDialog(page: Page, answer: DialogAnswer): Promise<AnsweredDialog> {
  return new Promise<AnsweredDialog>((resolve, reject) => {
    page.once('dialog', (dialog) => {
      const answered: AnsweredDialog = { type: dialog.type(), message: dialog.message() };
      const handled =
        answer.action === 'accept' ? dialog.accept(answer.promptText) : dialog.dismiss();

      handled.then(() => {
        resolve(answered);
      }, reject);
    });
  });
}

test.describe('Browser dialog handling', () => {
  test(
    'a visitor acknowledges the alert dialog raised by mouse and by keyboard',
    { tag: ['@ui', '@regression'] },
    async ({ popupsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Popups',
        subSuiteName: 'Alert Dialog',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Popups exercise', async () => {
        await popupsPage.open();
      });

      const alertTrigger = popupsPage.dialogTrigger('alert');
      await expect(alertTrigger).toBeVisible();
      await expect(alertTrigger).toHaveAccessibleName('Alert Popup');

      // The alert publishes no outcome on the page, so the dialog's own type and message
      // are the only evidence that the visitor's action raised the intended dialog. Both
      // activation routes are exercised here because this trigger is the one whose
      // keyboard operability is not already proven by an outcome elsewhere in this suite.
      const mouseAlert = answerNextDialog(page, { action: 'accept' });

      await test.step('raise the alert dialog with the mouse and accept it', async () => {
        await popupsPage.requestDialog('alert');
      });

      const alertFromMouse = await mouseAlert;
      expect(alertFromMouse).toEqual({ type: 'alert', message: ALERT_MESSAGE });

      const keyboardAlert = answerNextDialog(page, { action: 'accept' });

      await test.step('raise the alert dialog from the keyboard and accept it', async () => {
        await alertTrigger.focus();
        await expect(alertTrigger).toBeFocused();
        await page.keyboard.press('Enter');
      });

      const alertFromKeyboard = await keyboardAlert;
      expect(alertFromKeyboard).toEqual({ type: 'alert', message: ALERT_MESSAGE });

      logger.logOperation({
        operation: 'browser-dialog-alert-accepted',
        target: EXERCISE_PATH,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
        details: { dialogType: 'alert', choice: 'accept' },
      });
    },
  );

  test(
    'a visitor accepts the confirm dialog and the page reports the accepted choice',
    { tag: ['@ui', '@regression'] },
    async ({ popupsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Popups',
        subSuiteName: 'Confirm Dialog',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Popups exercise', async () => {
        await popupsPage.open();
      });

      const confirmTrigger = popupsPage.dialogTrigger('confirm');
      await expect(confirmTrigger).toBeVisible();
      await expect(confirmTrigger).toHaveAccessibleName('Confirm Popup');

      // The outcome paragraph is empty until the dialog is answered, so proving the
      // message is absent first is what makes the assertion after the answer evidence of
      // cause and effect rather than of pre-existing page content.
      await expect(popupsPage.confirmOutcome('OK it is!')).toHaveCount(0);

      const confirmDialog = answerNextDialog(page, { action: 'accept' });

      await test.step('raise the confirm dialog and accept it', async () => {
        await popupsPage.requestDialog('confirm');
      });

      expect(await confirmDialog).toEqual({ type: 'confirm', message: CONFIRM_MESSAGE });
      await expect(popupsPage.confirmOutcome('OK it is!')).toBeVisible();

      logger.logOperation({
        operation: 'browser-dialog-confirm-accepted',
        target: EXERCISE_PATH,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
        details: { dialogType: 'confirm', choice: 'accept' },
      });
    },
  );

  test(
    'a visitor dismisses the confirm dialog and the page reports the declined choice',
    { tag: ['@ui', '@regression'] },
    async ({ popupsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Popups',
        subSuiteName: 'Confirm Dialog',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Popups exercise', async () => {
        await popupsPage.open();
      });

      await expect(popupsPage.confirmOutcome('Cancel it is!')).toHaveCount(0);

      const confirmDialog = answerNextDialog(page, { action: 'dismiss' });

      await test.step('raise the confirm dialog and dismiss it', async () => {
        await popupsPage.requestDialog('confirm');
      });

      expect(await confirmDialog).toEqual({ type: 'confirm', message: CONFIRM_MESSAGE });
      await expect(popupsPage.confirmOutcome('Cancel it is!')).toBeVisible();
      await expect(popupsPage.confirmOutcome('OK it is!')).toHaveCount(0);

      logger.logOperation({
        operation: 'browser-dialog-confirm-dismissed',
        target: EXERCISE_PATH,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
        details: { dialogType: 'confirm', choice: 'dismiss' },
      });
    },
  );

  test(
    'a visitor answers the prompt dialog with a name and the page greets that name',
    { tag: ['@ui', '@regression'] },
    async ({ popupsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Popups',
        subSuiteName: 'Prompt Dialog',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Popups exercise', async () => {
        await popupsPage.open();
      });

      const promptTrigger = popupsPage.dialogTrigger('prompt');
      await expect(promptTrigger).toBeVisible();
      await expect(promptTrigger).toHaveAccessibleName('Prompt Popup');

      await expect(popupsPage.promptOutcome(PROMPT_GREETING)).toHaveCount(0);

      const promptDialog = answerNextDialog(page, { action: 'accept', promptText: VISITOR_NAME });

      await test.step(`raise the prompt dialog and answer it with "${VISITOR_NAME}"`, async () => {
        await popupsPage.requestDialog('prompt');
      });

      expect(await promptDialog).toEqual({ type: 'prompt', message: PROMPT_MESSAGE });
      await expect(popupsPage.promptOutcome(PROMPT_GREETING)).toBeVisible();

      logger.logOperation({
        operation: 'browser-dialog-prompt-answered',
        target: EXERCISE_PATH,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
        details: { dialogType: 'prompt', choice: 'accept' },
      });
    },
  );

  test(
    'a visitor dismisses the prompt dialog and the page reports the unanswered entry',
    { tag: ['@ui', '@regression'] },
    async ({ popupsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Popups',
        subSuiteName: 'Prompt Dialog',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Popups exercise', async () => {
        await popupsPage.open();
      });

      await expect(popupsPage.promptOutcome('Fine, be that way...')).toHaveCount(0);

      const promptDialog = answerNextDialog(page, { action: 'dismiss' });

      await test.step('raise the prompt dialog and dismiss it', async () => {
        await popupsPage.requestDialog('prompt');
      });

      expect(await promptDialog).toEqual({ type: 'prompt', message: PROMPT_MESSAGE });
      await expect(popupsPage.promptOutcome('Fine, be that way...')).toBeVisible();

      logger.logOperation({
        operation: 'browser-dialog-prompt-dismissed',
        target: EXERCISE_PATH,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
        details: { dialogType: 'prompt', choice: 'dismiss' },
      });
    },
  );
});
