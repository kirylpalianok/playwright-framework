import type { Locator, Page } from '@playwright/test';

/** The browser dialogs the Popups exercise can raise, named after the dialog each one is. */
export type DialogKind = 'alert' | 'confirm' | 'prompt';

/** The messages the exercise renders once the visitor answers the confirm dialog. */
export type ConfirmOutcomeMessage = 'OK it is!' | 'Cancel it is!';

/**
 * The messages the exercise renders once the visitor answers the prompt dialog. An
 * accepted prompt is greeted with the name the visitor entered, so that message is only
 * complete once the caller supplies it.
 */
export type PromptOutcomeMessage = `Nice to meet you, ${string}!` | 'Fine, be that way...';

/** The visible label of the button that raises each dialog, which is its accessible name. */
const DIALOG_TRIGGER_LABELS: Readonly<Record<DialogKind, string>> = {
  alert: 'Alert Popup',
  confirm: 'Confirm Popup',
  prompt: 'Prompt Popup',
};

/**
 * Adapter for the Popups practice page. Owns opening the page and asking it to raise one
 * of its browser dialogs, and exposes the semantic locators a test needs to observe the
 * triggers and the outcome the page publishes after a dialog is answered.
 *
 * Answering a dialog is deliberately absent from this adapter: the dialog belongs to the
 * browser rather than to the page, and the choice made in it is the behaviour under test,
 * so its handler is registered by the specification (docs/project-backlog.md, Story 7).
 *
 * Testability gap: the two outcome paragraphs carry no accessible name and are empty until
 * a dialog is answered, so neither can be addressed by role or label. They are located by
 * the message the caller expects to read — the page's published contract — rather than by
 * their element identifiers or position, and the message unions above keep that contract
 * in one place instead of spreading raw text through the specifications.
 */
export class PopupsPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/popups/');
  }

  /** The exercise's own content region, which scopes every locator below it. */
  private exerciseRegion(): Locator {
    return this.page.getByRole('main');
  }

  /** The button that asks the browser to raise the named dialog. */
  dialogTrigger(kind: DialogKind): Locator {
    return this.exerciseRegion().getByRole('button', {
      name: DIALOG_TRIGGER_LABELS[kind],
      exact: true,
    });
  }

  /**
   * Activates the named dialog's trigger. The dialog opens and blocks the page until it is
   * answered, so a handler must already be registered when this is called.
   */
  async requestDialog(kind: DialogKind): Promise<void> {
    await this.dialogTrigger(kind).click();
  }

  /** The outcome the page publishes after the confirm dialog is answered. */
  confirmOutcome(message: ConfirmOutcomeMessage): Locator {
    return this.outcomeMessage(message);
  }

  /** The outcome the page publishes after the prompt dialog is answered. */
  promptOutcome(message: PromptOutcomeMessage): Locator {
    return this.outcomeMessage(message);
  }

  /**
   * An outcome paragraph, addressed by the message it carries: before a dialog is answered
   * the paragraph is empty and the locator resolves to nothing, and afterwards it resolves
   * to the paragraph that reports the visitor's choice.
   */
  private outcomeMessage(message: string): Locator {
    return this.exerciseRegion().getByText(message, { exact: true });
  }
}
