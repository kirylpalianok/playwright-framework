import type { Locator, Page } from '@playwright/test';

/** The animals the Click Events exercise offers as selectable buttons. */
export type Animal = 'Cat' | 'Dog' | 'Pig' | 'Cow';

/** The sounds the exercise renders as its result heading after an animal is selected. */
export type AnimalSound = 'Meow!' | 'Woof!' | 'Oink!' | 'Moo!';

/**
 * Adapter for the Click Events practice page. Owns opening the page and selecting a
 * named animal, and exposes the semantic locators a test needs to observe the selected
 * control and the resulting sound; it does not decide which animal to select, which
 * sound that animal should produce, or assert the outcome.
 */
export class ClickEventsPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.goto('/click-events/');
  }

  animalButton(animal: Animal): Locator {
    return this.page.getByRole('button', { name: animal, exact: true });
  }

  async selectAnimal(animal: Animal): Promise<void> {
    await this.animalButton(animal).click();
  }

  /**
   * The result heading the page fills in with the selected animal's sound. It carries no
   * text until an animal is selected, so it is addressed by the sound the caller expects
   * to observe: before the selection the locator resolves to nothing, and after it the
   * heading's accessible name is that sound.
   */
  soundResult(sound: AnimalSound): Locator {
    return this.page.getByRole('heading', { name: sound, exact: true, level: 2 });
  }
}
