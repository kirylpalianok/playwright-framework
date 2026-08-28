import type { AutomationOpinion, FavoriteColor, FavoriteDrink } from '../../../src/ui/pages/form-fields.page.js';

export interface FormFieldValues {
  readonly name: string;
  readonly password: string;
  readonly favoriteDrinks: readonly FavoriteDrink[];
  readonly favoriteColor: FavoriteColor;
  readonly automationOpinion: AutomationOpinion;
  readonly email: string;
  readonly message: string;
}

const DEFAULT_FORM_FIELD_VALUES: FormFieldValues = {
  name: 'Automation QA',
  password: 'Synthetic-Password-1',
  favoriteDrinks: ['Water', 'Coffee'],
  favoriteColor: 'Blue',
  automationOpinion: 'Yes',
  email: 'automation.qa@example.com',
  message: 'Synthetic message entered for automated form-control coverage.',
};

/**
 * Builds synthetic, non-PII values for the Form Fields practice page's controls, with
 * safe defaults and explicit per-field overrides. Every default uses the reserved
 * `example.com` domain and clearly synthetic text so no test accidentally resembles a
 * real submission, even though these tests never submit the form (Story 3, CLAUDE.md
 * section 9).
 */
export function buildFormFieldValues(overrides: Partial<FormFieldValues> = {}): FormFieldValues {
  return { ...DEFAULT_FORM_FIELD_VALUES, ...overrides };
}
