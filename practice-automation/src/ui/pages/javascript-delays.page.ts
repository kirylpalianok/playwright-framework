import type { Locator, Page } from '@playwright/test';

/**
 * Adapter for the JavaScript Delays practice page. Owns opening the page and starting its
 * countdown, and exposes the semantic locator a test needs to observe the liftoff outcome;
 * it does not decide when the countdown has finished or assert on it.
 */
export class JavaScriptDelaysPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/javascript-delays/');
  }

  async startCountdown(): Promise<void> {
    await this.page.getByRole('button', { name: 'Start', exact: true }).click();
  }

  liftoffMessage(): Locator {
    return this.page.getByText('Liftoff!', { exact: true });
  }
}
