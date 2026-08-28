import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata } from '../../src/core/observability/allure/suite-metadata.js';
import { buildFormFieldValues } from '../test-data/builders/form-field-values.builder.js';
import type { FavoriteDrink } from '../../src/ui/pages/form-fields.page.js';

const FEATURE_NAME = 'Safe Form State';
const STORY_NAME = 'Exercise form controls without submitting public data';

test.describe('Form field controls', () => {
  test(
    'a visitor enters a value into the required Name field using the keyboard',
    { tag: ['@ui', '@regression'] },
    async ({ formFieldsPage, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Form Fields',
        subSuiteName: 'Required Text Input',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const { name } = buildFormFieldValues();
      const startedAt = Date.now();

      await test.step('open the Form Fields exercise', async () => {
        await formFieldsPage.open();
      });

      const nameInput = formFieldsPage.nameInput();
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toHaveJSProperty('required', true);

      await test.step('type a synthetic name via the keyboard', async () => {
        await formFieldsPage.enterName(name);
      });

      await expect(nameInput).toHaveValue(name);

      logger.logOperation({
        operation: 'form-fields-name-input',
        target: '/form-fields/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );

  test(
    'a visitor enters a value into the Password field using the keyboard',
    { tag: ['@ui', '@regression'] },
    async ({ formFieldsPage, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Form Fields',
        subSuiteName: 'Password',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const { password } = buildFormFieldValues();
      const startedAt = Date.now();

      await test.step('open the Form Fields exercise', async () => {
        await formFieldsPage.open();
      });

      const passwordInput = formFieldsPage.passwordInput();
      await expect(passwordInput).toBeVisible();
      await expect(passwordInput).toHaveAttribute('type', 'password');

      await test.step('type a synthetic password via the keyboard', async () => {
        await formFieldsPage.enterPassword(password);
      });

      await expect(passwordInput).toHaveValue(password);

      logger.logOperation({
        operation: 'form-fields-password-input',
        target: '/form-fields/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );

  test(
    'a visitor selects multiple favorite drinks from the checkbox group using the keyboard',
    { tag: ['@ui', '@regression'] },
    async ({ formFieldsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Form Fields',
        subSuiteName: 'Checkbox Group',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const { favoriteDrinks } = buildFormFieldValues();
      const additionalDrink: FavoriteDrink = 'Milk';
      const startedAt = Date.now();

      await test.step('open the Form Fields exercise', async () => {
        await formFieldsPage.open();
      });

      await test.step('check every synthetic favorite drink with the keyboard', async () => {
        for (const drink of favoriteDrinks) {
          const checkbox = formFieldsPage.favoriteDrinkCheckbox(drink);
          await expect(checkbox).toBeVisible();
          await checkbox.focus();
          await page.keyboard.press('Space');
        }
      });

      await test.step('select an additional drink through the page object', async () => {
        await formFieldsPage.selectFavoriteDrinks([additionalDrink]);
      });

      for (const drink of [...favoriteDrinks, additionalDrink]) {
        await expect(formFieldsPage.favoriteDrinkCheckbox(drink)).toBeChecked();
      }

      logger.logOperation({
        operation: 'form-fields-checkbox-group',
        target: '/form-fields/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );

  test(
    'a visitor picks one favorite color from the mutually exclusive radio group using the keyboard',
    { tag: ['@ui', '@regression'] },
    async ({ formFieldsPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Form Fields',
        subSuiteName: 'Radio Group',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Form Fields exercise', async () => {
        await formFieldsPage.open();
      });

      const red = formFieldsPage.favoriteColorRadio('Red');
      const blue = formFieldsPage.favoriteColorRadio('Blue');
      await expect(red).toBeVisible();
      await expect(blue).toBeVisible();

      await test.step('select Red through the page object', async () => {
        await formFieldsPage.selectFavoriteColor('Red');
      });

      await expect(red).toBeChecked();

      await test.step('move the selection to Blue with the keyboard', async () => {
        await red.focus();
        await page.keyboard.press('ArrowDown');
      });

      await expect(blue).toBeChecked();
      await expect(red).not.toBeChecked();

      logger.logOperation({
        operation: 'form-fields-radio-group',
        target: '/form-fields/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );

  test(
    'a visitor selects an automation opinion from the select control',
    { tag: ['@ui', '@regression'] },
    async ({ formFieldsPage, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Form Fields',
        subSuiteName: 'Select',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      // The underlying <select> has no accessible name (see FormFieldsPage.automationSelect
      // for the documented testability gap), so this is the one control in this
      // specification that is located by its data-testid rather than an accessible role/name.
      const { automationOpinion } = buildFormFieldValues();
      const startedAt = Date.now();

      await test.step('open the Form Fields exercise', async () => {
        await formFieldsPage.open();
      });

      const automationSelect = formFieldsPage.automationSelect();
      await expect(automationSelect).toBeVisible();

      await test.step('select the synthetic automation opinion', async () => {
        await formFieldsPage.selectAutomationOpinion(automationOpinion);
      });

      await expect(automationSelect).toHaveValue('yes');

      logger.logOperation({
        operation: 'form-fields-select',
        target: '/form-fields/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );

  test(
    'a visitor enters a synthetic email using the keyboard',
    { tag: ['@ui', '@regression'] },
    async ({ formFieldsPage, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Form Fields',
        subSuiteName: 'Email',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const { email } = buildFormFieldValues();
      const startedAt = Date.now();

      await test.step('open the Form Fields exercise', async () => {
        await formFieldsPage.open();
      });

      const emailInput = formFieldsPage.emailInput();
      await expect(emailInput).toBeVisible();

      await test.step('type a synthetic email via the keyboard', async () => {
        await formFieldsPage.enterEmail(email);
      });

      await expect(emailInput).toHaveValue(email);

      logger.logOperation({
        operation: 'form-fields-email-input',
        target: '/form-fields/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );

  test(
    'a visitor enters a synthetic message using the keyboard',
    { tag: ['@ui', '@regression'] },
    async ({ formFieldsPage, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Form Fields',
        subSuiteName: 'Message',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const { message } = buildFormFieldValues();
      const startedAt = Date.now();

      await test.step('open the Form Fields exercise', async () => {
        await formFieldsPage.open();
      });

      const messageTextArea = formFieldsPage.messageTextArea();
      await expect(messageTextArea).toBeVisible();

      await test.step('type a synthetic message via the keyboard', async () => {
        await formFieldsPage.enterMessage(message);
      });

      await expect(messageTextArea).toHaveValue(message);

      logger.logOperation({
        operation: 'form-fields-message-textarea',
        target: '/form-fields/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );
});
