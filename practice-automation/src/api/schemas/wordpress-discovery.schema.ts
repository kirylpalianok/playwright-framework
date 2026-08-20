/**
 * A deliberately narrow view of the WordPress REST API discovery document served at
 * `/wp-json/`. This models only the public site-identity and namespace-advertisement
 * fields the smoke test needs; it does not model WordPress route/endpoint internals as
 * a business API (see docs/architecture.md, API layer).
 */
export interface WordPressDiscoveryDocument {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly namespaces: readonly string[];
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

/**
 * Validates an untrusted JSON payload against the small discovery-document contract and
 * returns a typed result. Throws a descriptive error naming the missing/invalid field
 * when the payload does not satisfy the contract.
 */
export function parseWordPressDiscoveryDocument(payload: unknown): WordPressDiscoveryDocument {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('WordPress discovery response body must be a JSON object.');
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.name !== 'string' || record.name.length === 0) {
    throw new Error('WordPress discovery response is missing a non-empty "name" field.');
  }
  if (typeof record.description !== 'string') {
    throw new Error('WordPress discovery response is missing a "description" field.');
  }
  if (typeof record.url !== 'string' || record.url.length === 0) {
    throw new Error('WordPress discovery response is missing a non-empty "url" field.');
  }
  if (!isStringArray(record.namespaces)) {
    throw new Error('WordPress discovery response is missing a "namespaces" string array.');
  }

  return {
    name: record.name,
    description: record.description,
    url: record.url,
    namespaces: record.namespaces,
  };
}
