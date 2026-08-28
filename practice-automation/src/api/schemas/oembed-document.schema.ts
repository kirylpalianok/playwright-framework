import { requireJsonObject } from '../../core/validation/json-boundary.js';

/**
 * The published oEmbed representation of one page, as defined by the oEmbed
 * specification (https://oembed.com) and served by the target at
 * `/wp-json/oembed/1.0/embed?url=…`. This is a public, versioned contract for sharing a
 * page, not a WordPress implementation detail.
 *
 * Only the fields that identify the shared page and its provider are modelled. The
 * response also carries authorship, embed markup, and dimension fields; those are
 * incidental to the availability contract under test, and the authorship fields name a
 * real person, so they are deliberately not mapped or asserted.
 */
export interface OEmbedDocument {
  /** oEmbed specification version the provider implements, for example `"1.0"`. */
  readonly version: string;
  /** oEmbed resource type, for example `"rich"` or `"link"`. */
  readonly type: string;
  /** Title of the shared page. */
  readonly title: string;
  readonly providerName: string;
  readonly providerUrl: string;
}

/**
 * Validates an untrusted JSON payload against the oEmbed fields above and returns a
 * typed result. Throws a descriptive error naming the missing/invalid field when the
 * payload does not satisfy the contract.
 */
export function parseOEmbedDocument(payload: unknown): OEmbedDocument {
  const document = requireJsonObject(payload, 'oEmbed');

  return {
    version: document.requireNonEmptyString('version'),
    type: document.requireNonEmptyString('type'),
    title: document.requireNonEmptyString('title'),
    providerName: document.requireNonEmptyString('provider_name'),
    providerUrl: document.requireNonEmptyString('provider_url'),
  };
}
