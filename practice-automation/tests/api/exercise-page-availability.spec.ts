import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata } from '../../src/core/observability/allure/suite-metadata.js';
import { parseOEmbedDocument } from '../../src/api/schemas/oembed-document.schema.js';

const EXERCISE_PATH = '/javascript-delays/';
const EXERCISE_NAME = 'JavaScript Delays';

/** oEmbed specification version the provider must advertise (https://oembed.com). */
const OEMBED_VERSION = '1.0';

test.describe('Practice exercise availability', () => {
  test(
    'a client confirms the JavaScript Delays exercise page is served',
    { tag: ['@api', '@regression'] },
    async ({ readOnlyRequests }) => {
      await applySuiteMetadata({
        layer: 'API',
        suiteName: 'Practice Exercise Availability',
        subSuiteName: 'JavaScript Delays',
        featureName: 'Read-Only Resource Contracts',
        storyName: 'Confirm a published exercise page is served',
      });

      const exercisePage = await test.step(`request the headers of the ${EXERCISE_NAME} exercise page`, () =>
        readOnlyRequests.head(EXERCISE_PATH));

      expect(exercisePage.status, 'exercise page status code').toBe(200);
      expect(exercisePage.headers['content-type'], 'exercise page content-type header').toContain('text/html');
    },
  );

  test(
    'a client retrieves the shareable summary of the JavaScript Delays exercise page',
    { tag: ['@api', '@regression'] },
    async ({ readOnlyRequests, targetBaseUrl }) => {
      await applySuiteMetadata({
        layer: 'API',
        suiteName: 'Practice Exercise Availability',
        subSuiteName: 'JavaScript Delays',
        featureName: 'Read-Only Resource Contracts',
        storyName: 'Retrieve the shareable summary of an exercise page',
      });

      // The absolute URL comes from the injected configuration, so this specification
      // states which page it shares without embedding an environment URL of its own.
      const exerciseUrl = new URL(EXERCISE_PATH, targetBaseUrl).toString();

      const summaryResponse = await test.step(`request the shareable summary of the ${EXERCISE_NAME} exercise page`, () =>
        readOnlyRequests.get(`/wp-json/oembed/1.0/embed?url=${encodeURIComponent(exerciseUrl)}`));

      expect(summaryResponse.status, 'oEmbed endpoint status code').toBe(200);
      expect(summaryResponse.headers['content-type'], 'oEmbed endpoint content-type header').toContain(
        'application/json',
      );

      const summary = await summaryResponse.readJson(parseOEmbedDocument);

      expect(summary.version, 'advertised oEmbed specification version').toBe(OEMBED_VERSION);
      expect(summary.title, 'shared page title').toContain(EXERCISE_NAME);
    },
  );
});
