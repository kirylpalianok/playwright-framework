import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata } from '../../src/core/observability/allure/suite-metadata.js';
import type { Animal, AnimalSound } from '../../src/ui/pages/click-events.page.js';

/** The sound the exercise is expected to display for a selected animal. */
interface AnimalSelection {
  readonly animal: Animal;
  readonly sound: AnimalSound;
}

// The four buttons share one event-to-heading mechanic and differ only in the literal
// they write, so a single animal is the representative equivalence class for the click
// behaviour itself (Story 5's note in docs/project-backlog.md). A second animal is used
// for the keyboard leg because the page replaces the result heading rather than adding
// to it: re-activating the same animal would produce no observable state change, so a
// distinct animal is what makes keyboard operability provable.
const MOUSE_SELECTION: AnimalSelection = { animal: 'Cat', sound: 'Meow!' };
const KEYBOARD_SELECTION: AnimalSelection = { animal: 'Dog', sound: 'Woof!' };

test.describe('Click event feedback', () => {
  test(
    'a visitor selects an animal by mouse or keyboard and sees the matching sound displayed',
    { tag: ['@ui', '@regression'] },
    async ({ clickEventsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Click Events',
        subSuiteName: 'Animal Selection',
        featureName: 'Event-Driven Visible Feedback',
        storyName: 'Verify click-event feedback',
      });

      const startedAt = Date.now();

      await test.step('open the Click Events exercise', async () => {
        await clickEventsPage.open();
      });

      const mouseAnimalButton = clickEventsPage.animalButton(MOUSE_SELECTION.animal);
      await expect(mouseAnimalButton).toBeVisible();
      await expect(mouseAnimalButton).toHaveAccessibleName(MOUSE_SELECTION.animal);

      // The result heading carries no text until an animal is selected, so proving it is
      // absent first is what makes the assertion after the selection evidence of cause
      // and effect rather than of pre-existing page content.
      await expect(clickEventsPage.soundResult(MOUSE_SELECTION.sound)).toHaveCount(0);

      await test.step(`select the ${MOUSE_SELECTION.animal} button`, async () => {
        await clickEventsPage.selectAnimal(MOUSE_SELECTION.animal);
      });

      await expect(clickEventsPage.soundResult(MOUSE_SELECTION.sound)).toBeVisible();

      const keyboardAnimalButton = clickEventsPage.animalButton(KEYBOARD_SELECTION.animal);
      await expect(keyboardAnimalButton).toBeVisible();
      await expect(keyboardAnimalButton).toHaveAccessibleName(KEYBOARD_SELECTION.animal);

      await test.step(`activate the ${KEYBOARD_SELECTION.animal} button with the keyboard`, async () => {
        await keyboardAnimalButton.focus();
        await page.keyboard.press('Enter');
      });

      await expect(clickEventsPage.soundResult(KEYBOARD_SELECTION.sound)).toBeVisible();
      await expect(clickEventsPage.soundResult(MOUSE_SELECTION.sound)).toHaveCount(0);

      logger.logOperation({
        operation: 'click-events-animal-selection',
        target: '/click-events/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );
});
