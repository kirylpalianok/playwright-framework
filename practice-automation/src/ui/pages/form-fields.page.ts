import type { Locator, Page } from '@playwright/test';

export type FavoriteDrink = 'Water' | 'Milk' | 'Coffee' | 'Wine' | 'Ctrl-Alt-Delight';
export type FavoriteColor = 'Red' | 'Blue' | 'Yellow' | 'Green' | '#FFC0CB';
export type AutomationOpinion = 'Yes' | 'No' | 'Undecided';

/**
 * Adapter for the Form Fields practice page. Owns opening the page and driving its
 * synthetic controls, and exposes the semantic locators a test needs to observe control
 * state; it does not decide what values to enter, submit the form, or assert outcomes.
 */
export class FormFieldsPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/form-fields/');
  }

  nameInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Name', exact: true });
  }

  async enterName(value: string): Promise<void> {
    await this.nameInput().pressSequentially(value);
  }

  passwordInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Password', exact: true });
  }

  async enterPassword(value: string): Promise<void> {
    await this.passwordInput().pressSequentially(value);
  }

  favoriteDrinkCheckbox(drink: FavoriteDrink): Locator {
    return this.page.getByRole('checkbox', { name: drink, exact: true });
  }

  async selectFavoriteDrinks(drinks: readonly FavoriteDrink[]): Promise<void> {
    for (const drink of drinks) {
      await this.favoriteDrinkCheckbox(drink).check();
    }
  }

  favoriteColorRadio(color: FavoriteColor): Locator {
    return this.page.getByRole('radio', { name: color, exact: true });
  }

  async selectFavoriteColor(color: FavoriteColor): Promise<void> {
    await this.favoriteColorRadio(color).check();
  }

  /**
   * The "Do you like automation?" `<select>` has no programmatically associated label:
   * the adjacent `<label>` carries no `for` attribute and does not wrap the control, so
   * it exposes no accessible name. This is a testability gap in the target page, not a
   * framework choice; per Story 3's backlog note ("use documented test IDs only when a
   * unique accessible contract is unavailable"), fall back to the page's documented
   * `data-testid="automation"` rather than a layout selector.
   */
  automationSelect(): Locator {
    return this.page.getByTestId('automation');
  }

  async selectAutomationOpinion(opinion: AutomationOpinion): Promise<void> {
    await this.automationSelect().selectOption({ label: opinion });
  }

  emailInput(): Locator {
    return this.page.getByRole('textbox', { name: 'Email', exact: true });
  }

  async enterEmail(value: string): Promise<void> {
    await this.emailInput().pressSequentially(value);
  }

  messageTextArea(): Locator {
    return this.page.getByRole('textbox', { name: 'Message', exact: true });
  }

  async enterMessage(value: string): Promise<void> {
    await this.messageTextArea().pressSequentially(value);
  }
}
