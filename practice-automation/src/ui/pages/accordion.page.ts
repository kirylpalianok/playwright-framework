import type { Locator, Page } from '@playwright/test';

/**
 * Adapter for the Accordions practice page. Owns opening the page and expanding its
 * accordion item, and exposes the semantic locators a test needs to observe the
 * disclosure control, the item itself, and the revealed content; it does not decide when
 * the item should be expanded or assert its state.
 *
 * Testability gap: the exercise is a native `<details>`/`<summary>` disclosure with no
 * ARIA authoring on top of it. Playwright's accessibility engine exposes the `<details>`
 * element as a `group`, but `<summary>` has no role of its own and the target publishes no
 * `aria-expanded`, so the trigger cannot be located by role and the expanded state cannot
 * be queried through `getByRole({ expanded })`. The trigger is therefore located by the
 * visible label that is its accessible name, and the expanded state is observed through
 * the accessibility tree of the item (the collapsed item exposes only its name, while the
 * expanded item also exposes its content) rather than through a styling class or DOM
 * traversal. Both are contracts of the page, not of its markup.
 */
export class AccordionPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/accordions/');
  }

  /** The exercise's own content region, which scopes every locator below it. */
  private exerciseRegion(): Locator {
    return this.page.getByRole('main');
  }

  /**
   * The accordion item, exposed to the accessibility tree as a group. The exercise
   * publishes exactly one inside the page's main region, so the role alone identifies it;
   * a second item appearing would be a change of contract that must fail visibly.
   */
  panel(): Locator {
    return this.exerciseRegion().getByRole('group');
  }

  /** The disclosure control that expands the item, addressed by its visible label. */
  disclosureTrigger(): Locator {
    return this.exerciseRegion().getByText('Click to see more', { exact: true });
  }

  /**
   * The item's content, scoped to the item that owns it. It is absent from the page while
   * the item is collapsed, so the locator resolves to nothing until the item is expanded.
   */
  panelContent(): Locator {
    return this.panel().getByRole('paragraph');
  }

  /**
   * Activates the disclosure control from the collapsed state. The underlying `<details>`
   * element toggles, so calling this on an already expanded item collapses it.
   */
  async expandPanel(): Promise<void> {
    await this.disclosureTrigger().click();
  }
}
