import type { Locator } from '@playwright/test';

/** The visible label of the control that dismisses a modal, which is its accessible name. */
const CLOSE_CONTROL_NAME = 'Close';

/**
 * Adapter for a modal dialog shown over the Modals practice page. Owns the mechanics both
 * of that exercise's modals share — the dialog a visitor is shown and the control that
 * dismisses it — and exposes them as semantic locators and one dismissal operation; it
 * does not decide which modal should be open or assert its content.
 *
 * Extracted because both the simple modal and the form modal depend on exactly these
 * mechanics (docs/project-backlog.md, Story 9). It is constructed from the dialog's own
 * locator so the page that owns the modal decides how that dialog is identified.
 *
 * Testability gap: the target's modals declare `aria-modal="false"` and leave focus on the
 * trigger when they open, so focus is neither moved into the dialog nor trapped inside it,
 * and the dialog's controls are not reachable by tabbing forward from the trigger. Focus
 * behaviour is therefore asserted only where the target supports it — the key-dismissal
 * route that returns focus to the trigger — rather than assumed from the dialog role.
 *
 * The form modal's submit control is deliberately absent from this adapter: the form posts
 * to a public contact endpoint, and no specification may submit it.
 */
export class ModalDialog {
  constructor(private readonly container: Locator) {}

  /** The dialog itself, which publishes the accessible name the visitor is shown. */
  dialog(): Locator {
    return this.container;
  }

  /** The control that dismisses the dialog, addressed by its accessible name. */
  closeControl(): Locator {
    return this.container.getByRole('button', { name: CLOSE_CONTROL_NAME, exact: true });
  }

  /** Dismisses the dialog through its close control. */
  async close(): Promise<void> {
    await this.closeControl().click();
  }
}
