import { expect, test } from '../../src/core/fixtures/framework.fixtures.js';
import { applySuiteMetadata, Severity } from '../../src/core/observability/allure/suite-metadata.js';
import { parseWordPressDiscoveryDocument } from '../../src/api/schemas/wordpress-discovery.schema.js';

test.describe('WordPress REST API discovery', () => {
  test(
    'a client retrieves the site discovery document from the REST API root',
    { tag: ['@smoke', '@api'] },
    async ({ request, logger }) => {
      await applySuiteMetadata({
        layer: 'API',
        suiteName: 'WordPress REST Discovery',
        subSuiteName: 'Discovery Endpoint',
        featureName: 'REST API Discovery',
        storyName: 'Retrieve the site discovery document',
        severity: Severity.CRITICAL,
      });

      const startedAt = Date.now();

      const response = await test.step('request the REST API discovery document', () => request.get('/wp-json/'));

      expect(response.status(), 'discovery endpoint status code').toBe(200);
      expect(response.headers()['content-type'], 'discovery endpoint content-type header').toContain('application/json');

      const discoveryDocument = parseWordPressDiscoveryDocument(await response.json());

      expect(discoveryDocument.namespaces.length, 'advertised REST namespaces').toBeGreaterThan(0);

      logger.logOperation({
        operation: 'wordpress-discovery-fetch',
        target: '/wp-json/',
        outcome: 'success',
        durationMs: Date.now() - startedAt,
      });
    },
  );
});
