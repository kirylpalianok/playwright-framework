import type { Page } from '@playwright/test';

/**
 * Adapter for the Practice Automation catalogue landing page. Owns opening the
 * catalogue and following a named exercise link; it does not decide which exercise a
 * test should visit or assert the resulting page's content.
 */
export class PracticeCatalogPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async openExercise(exerciseName: string): Promise<void> {
    await this.page.getByRole('link', { name: exerciseName, exact: true }).click();
  }
}
