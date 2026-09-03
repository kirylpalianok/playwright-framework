import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata } from '../../src/core/observability/allure/suite-metadata.js';

const FEATURE_NAME = 'Expandable Content';
const STORY_NAME = 'Verify accordion behavior by mouse and keyboard';

/** The content the exercise reveals once its accordion item is expanded. */
const REVEALED_CONTENT = 'This is an accordion item.';

// The accordion item's accessible role and name, as the collapsed item publishes them.
// Aria-snapshot matching is a subset match, so this one also holds once the item is
// expanded: it is the role/name check, not the collapsed-state check. The collapsed state
// itself is proven by the content being unavailable to the visitor.
const ACCESSIBLE_ROLE_AND_NAME = '- group: Click to see more';

// The accessible state of the expanded item: the accessibility tree publishes the
// revealed content as part of the item. Verified to fail against the collapsed item, so
// it is what proves the accessible state agrees with what the visitor can read — a
// contract the target does not express through `aria-expanded` (see AccordionPage for the
// documented testability gap).
const EXPANDED_ACCESSIBLE_STATE = `
  - group:
    - text: Click to see more
    - paragraph: ${REVEALED_CONTENT}
`;

test.describe('Accordion item expansion', () => {
  test(
    'a visitor expands the accordion item with the mouse and reads the revealed content',
    { tag: ['@ui', '@regression'] },
    async ({ accordionPage, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Accordions',
        subSuiteName: 'Mouse Expansion',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Accordions exercise', async () => {
        await accordionPage.open();
      });

      await expect(accordionPage.disclosureTrigger()).toBeVisible();

      await expect(accordionPage.panel()).toMatchAriaSnapshot(ACCESSIBLE_ROLE_AND_NAME);

      // The item starts collapsed, so proving its content is unavailable first is what
      // makes the assertions after the interaction evidence of cause and effect rather
      // than of pre-existing page content.
      await expect(accordionPage.panelContent()).toBeHidden();

      await test.step('expand the accordion item by clicking its title', async () => {
        await accordionPage.expandPanel();
      });

      await expect(accordionPage.panelContent()).toHaveText(REVEALED_CONTENT);
      await expect(accordionPage.panel()).toMatchAriaSnapshot(EXPANDED_ACCESSIBLE_STATE);

      logger.logOperation({
        operation: 'accordion-mouse-expansion',
        target: '/accordions/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );

  test(
    'a visitor expands the accordion item with the keyboard and reads the revealed content',
    { tag: ['@ui', '@regression'] },
    async ({ accordionPage, page, logger }) => {
      await applySuiteMetadata({
        layer: 'UI',
        suiteName: 'Accordions',
        subSuiteName: 'Keyboard Expansion',
        featureName: FEATURE_NAME,
        storyName: STORY_NAME,
      });

      const startedAt = Date.now();

      await test.step('open the Accordions exercise', async () => {
        await accordionPage.open();
      });

      const disclosureTrigger = accordionPage.disclosureTrigger();
      await expect(disclosureTrigger).toBeVisible();
      await expect(accordionPage.panelContent()).toBeHidden();

      await test.step('expand the accordion item from the keyboard', async () => {
        await disclosureTrigger.focus();
        await expect(disclosureTrigger).toBeFocused();
        await page.keyboard.press('Enter');
      });

      await expect(accordionPage.panelContent()).toHaveText(REVEALED_CONTENT);
      await expect(accordionPage.panel()).toMatchAriaSnapshot(EXPANDED_ACCESSIBLE_STATE);

      logger.logOperation({
        operation: 'accordion-keyboard-expansion',
        target: '/accordions/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );
});
