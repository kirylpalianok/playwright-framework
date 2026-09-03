import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata } from '../../src/core/observability/allure/suite-metadata.js';
import type { FormModalField } from '../../src/ui/pages/modals.page.js';

const EXERCISE_PATH = '/modals/';
const FEATURE_NAME = 'Modal Overlays';
const STORY_NAME = 'Add modal behavior and extract a dialog component only if earned';

/** The accessible name each modal publishes, which identifies the dialog a visitor is shown. */
const SIMPLE_MODAL_NAME = 'Simple Modal';
const FORM_MODAL_NAME = 'Modal Containing A Form';

/** The message the simple modal presents, which is the content that proves it opened. */
const SIMPLE_MODAL_MESSAGE = 'Hi, I’m a simple modal.';

/** The controls the form modal's contact form presents to a visitor. */
const FORM_MODAL_FIELDS: readonly FormModalField[] = ['Name', 'Email', 'Message'];

test.describe('Modal overlays', () => {
  test(
    'a visitor opens the simple modal and dismisses it with its close control',
    { tag: ['@ui', '@regression'] },
    async ({ modalsPage, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Modals',
        subSuiteName: 'Simple Modal',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Modals exercise', async () => {
        await modalsPage.open();
      });

      const trigger = modalsPage.modalTrigger('simple');
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAccessibleName(SIMPLE_MODAL_NAME);

      const modal = modalsPage.shownModal();

      // No modal is exposed to the accessibility tree before the visitor asks for one, so
      // proving that first is what makes the assertions below evidence of cause and effect
      // rather than of content the page was already showing.
      await expect(modal.dialog()).toHaveCount(0);

      await test.step('open the simple modal', async () => {
        await modalsPage.requestModal('simple');
      });

      await expect(modal.dialog()).toBeVisible();
      await expect(modal.dialog()).toHaveAccessibleName(SIMPLE_MODAL_NAME);
      await expect(modal.dialog().getByText(SIMPLE_MODAL_MESSAGE, { exact: true })).toBeVisible();
      await expect(modal.closeControl()).toBeVisible();
      await expect(modal.closeControl()).toHaveAccessibleName('Close');

      await test.step('dismiss the simple modal with its close control', async () => {
        await modal.close();
      });

      await expect(modal.dialog()).toBeHidden();

      logger.logOperation({
        operation: 'modal-simple-dismissed',
        target: EXERCISE_PATH,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
        details: { modal: SIMPLE_MODAL_NAME, dismissal: 'close-control' },
      });
    },
  );

  test(
    'a visitor opens the form modal from the keyboard and dismisses it with the Escape key',
    { tag: ['@ui', '@regression'] },
    async ({ modalsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Modals',
        subSuiteName: 'Form Modal',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Modals exercise', async () => {
        await modalsPage.open();
      });

      const trigger = modalsPage.modalTrigger('form');
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAccessibleName('Form Modal');

      const modal = modalsPage.shownModal();
      await expect(modal.dialog()).toHaveCount(0);

      await test.step('open the form modal from the keyboard', async () => {
        await trigger.focus();
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Enter');
      });

      await expect(modal.dialog()).toBeVisible();
      await expect(modal.dialog()).toHaveAccessibleName(FORM_MODAL_NAME);
      await expect(modal.closeControl()).toHaveAccessibleName('Close');

      // The modal's purpose is the contact form it carries, so each labelled control is
      // proven present and untouched. Nothing is entered and nothing is submitted: the form
      // posts to the site's public contact endpoint, which this suite does not own.
      for (const field of FORM_MODAL_FIELDS) {
        await expect(modalsPage.formModalField(field)).toBeVisible();
        await expect(modalsPage.formModalField(field)).toHaveValue('');
      }

      await expect(modalsPage.formModalField('Name')).toHaveJSProperty('required', true);

      await test.step('dismiss the form modal with the Escape key', async () => {
        await page.keyboard.press('Escape');
      });

      await expect(modal.dialog()).toBeHidden();

      // The key dismissal is the one route on which this target manages focus: it hands
      // focus back to the trigger the visitor came from, leaving the keyboard where it
      // started rather than at the top of the document.
      await expect(trigger).toBeFocused();

      logger.logOperation({
        operation: 'modal-form-dismissed',
        target: EXERCISE_PATH,
        outcome: 'success',
        durationMs: Date.now() - startedAt,
        details: { modal: FORM_MODAL_NAME, dismissal: 'escape-key' },
      });
    },
  );
});
