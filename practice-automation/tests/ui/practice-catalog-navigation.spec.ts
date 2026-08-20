import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata, Severity } from '../../src/core/observability/allure/suite-metadata.js';

test.describe('Practice catalogue navigation', () => {
  test(
    'a visitor opens the JavaScript Delays exercise from the practice catalogue',
    { tag: ['@smoke', '@ui'] },
    async ({ catalogPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Practice Catalog',
        subSuiteName: 'Navigation',
        featureName: 'Catalogue Navigation',
        storyName: 'Open an exercise from the practice catalogue',
        severity: Severity.CRITICAL,
      });

      const startedAt = Date.now();

      await test.step('open the practice catalogue and follow the JavaScript Delays link', async () => {
        await catalogPage.open();
        await catalogPage.openExercise('JavaScript Delays');
      });

      await expect(page.getByRole('heading', { name: 'JavaScript Delays', level: 1 })).toBeVisible();
      await expect(page).toHaveURL(/\/javascript-delays\/?$/);

      logger.logOperation({
        operation: 'catalogue-navigation',
        target: '/javascript-delays/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );
});
