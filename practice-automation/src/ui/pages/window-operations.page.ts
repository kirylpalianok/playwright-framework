import type { Locator, Page } from '@playwright/test';

/**
 * The operations the Window Operations exercise offers, named after what each one does to
 * the visitor's browsing context: two open the destination in an additional page, and the
 * third replaces the page the visitor is already on.
 */
export type WindowOperation = 'new-tab' | 'new-window' | 'replace-window';

/** The visible label of the button that performs each operation, which is its accessible name. */
const OPERATION_TRIGGER_LABELS: Readonly<Record<WindowOperation, string>> = {
  'new-tab': 'New Tab',
  'new-window': 'New Window',
  'replace-window': 'Replace Window',
};

/**
 * Adapter for the Window Operations practice page. Owns opening the page and activating
 * one of its navigation triggers, and exposes the semantic locators a test needs to
 * observe those triggers; it does not decide which destination each trigger should reach
 * or assert the resulting page state.
 *
 * Waiting for the opened page or for the replacement navigation is deliberately absent
 * from this adapter. The page lifecycle event belongs to the browser rather than to the
 * page, and which page the visitor ends up on is the behaviour under test, so the popup
 * and navigation waits are registered by the specification before it activates a trigger
 * (CLAUDE.md section 7; docs/project-backlog.md, Story 8).
 *
 * All three triggers target the same external destination, so the destination each one is
 * expected to reach is asserted by the specification that owns that expectation.
 */
export class WindowOperationsPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/window-operations/');
  }

  /** The exercise's own content region, which scopes every locator below it. */
  private exerciseRegion(): Locator {
    return this.page.getByRole('main');
  }

  /** The button that performs the named window operation. */
  operationTrigger(operation: WindowOperation): Locator {
    return this.exerciseRegion().getByRole('button', {
      name: OPERATION_TRIGGER_LABELS[operation],
      exact: true,
    });
  }

  /**
   * Activates the named operation's trigger. The browser opens or replaces a page in
   * response, so the wait for that page must already be registered when this is called.
   */
  async requestOperation(operation: WindowOperation): Promise<void> {
    await this.operationTrigger(operation).click();
  }
}
