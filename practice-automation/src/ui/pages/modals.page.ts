import type { Locator, Page } from '@playwright/test';
import { ModalDialog } from '../components/modal-dialog.component.js';

/** The modals the exercise offers, named after what each one presents to the visitor. */
export type ModalKind = 'simple' | 'form';

/** The labelled controls the form modal's contact form publishes. */
export type FormModalField = 'Name' | 'Email' | 'Message';

/** The visible label of the button that opens each modal, which is its accessible name. */
const MODAL_TRIGGER_LABELS: Readonly<Record<ModalKind, string>> = {
  simple: 'Simple Modal',
  form: 'Form Modal',
};

/**
 * Adapter for the Modals practice page. Owns opening the page and activating the triggers
 * that raise its modals, and exposes the semantic locators a test needs to observe those
 * triggers and the modal that is currently shown; it does not decide which modal a trigger
 * should raise, what the dialog should be named, or when it should close.
 *
 * The modal itself is a `ModalDialog`, because the exercise's two modals share the same
 * dialog and close-control mechanics (docs/project-backlog.md, Story 9).
 *
 * The exercise renders its modals outside the page's main region and shows at most one at
 * a time, so `shownModal()` addresses the open dialog by its role alone: a second visible
 * dialog would be a change of contract that must fail visibly rather than be disambiguated
 * by position. While no modal is open, neither dialog is exposed to the accessibility tree
 * and the locator resolves to nothing.
 */
export class ModalsPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/modals/');
  }

  /** The exercise's own content region, which scopes the triggers below it. */
  private exerciseRegion(): Locator {
    return this.page.getByRole('main');
  }

  /** The button that raises the named modal. */
  modalTrigger(kind: ModalKind): Locator {
    return this.exerciseRegion().getByRole('button', {
      name: MODAL_TRIGGER_LABELS[kind],
      exact: true,
    });
  }

  /** Activates the named modal's trigger. */
  async requestModal(kind: ModalKind): Promise<void> {
    await this.modalTrigger(kind).click();
  }

  /** The modal the exercise is currently showing. */
  shownModal(): ModalDialog {
    return new ModalDialog(this.page.getByRole('dialog'));
  }

  /**
   * A control of the form modal's contact form, addressed by the label a visitor reads.
   * The label is matched as the visitor sees it rather than exactly, because the target
   * appends the field's required state to that text (`Name(required)`). Scoped to the shown
   * dialog, so the control resolves only while the form modal that owns it is open.
   */
  formModalField(field: FormModalField): Locator {
    return this.shownModal().dialog().getByLabel(field);
  }
}
