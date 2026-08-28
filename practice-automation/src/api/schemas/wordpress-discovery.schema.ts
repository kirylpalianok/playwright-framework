import { requireJsonObject } from '../../core/validation/json-boundary.js';

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

/**
 * Validates an untrusted JSON payload against the small discovery-document contract and
 * returns a typed result. Throws a descriptive error naming the missing/invalid field
 * when the payload does not satisfy the contract.
 */
export function parseWordPressDiscoveryDocument(payload: unknown): WordPressDiscoveryDocument {
  const document = requireJsonObject(payload, 'WordPress REST discovery');

  return {
    name: document.requireNonEmptyString('name'),
    description: document.requireString('description'),
    url: document.requireNonEmptyString('url'),
    namespaces: document.requireStringArray('namespaces'),
  };
}
