/**
 * Runtime validation helpers for untrusted JSON boundaries (CLAUDE.md section 5:
 * compile-time declarations do not validate runtime data). Schemas in `src/api/schemas`
 * compose these helpers so every boundary failure reads the same way: which boundary
 * failed, which field was expected, what arrived instead, and what to inspect next.
 *
 * Failure messages name the field and the *type* of the received value, never the value
 * itself, so an unexpected payload cannot leak its contents into logs or reports.
 */

/** Reads and validates fields of one untrusted JSON object. */
export interface JsonObjectBoundary {
  /** Returns the field as a string, or throws when it is absent or another type. */
  requireString(field: string): string;
  /** Returns the field as a string with at least one character, or throws. */
  requireNonEmptyString(field: string): string;
  /** Returns the field as an array whose entries are all strings, or throws. */
  requireStringArray(field: string): readonly string[];
}

const NEXT_DIAGNOSTIC_ACTION =
  'Next step: compare the endpoint\'s current response with the schema in src/api/schemas.';

function describeReceivedType(value: unknown): string {
  if (value === undefined) {
    return 'no value';
  }
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'an array';
  }
  return `a value of type ${typeof value}`;
}

function boundaryError(boundaryName: string, expectation: string, received: string): Error {
  return new Error(
    `Validating the ${boundaryName} response body failed: expected ${expectation}, received ${received}. ${NEXT_DIAGNOSTIC_ACTION}`,
  );
}

/**
 * Narrows an untrusted payload to a JSON object and returns a reader for its fields.
 * `boundaryName` names the contract under validation (for example
 * `'WordPress REST discovery'`) and appears in every failure raised by the reader.
 */
export function requireJsonObject(payload: unknown, boundaryName: string): JsonObjectBoundary {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    throw boundaryError(boundaryName, 'a JSON object', describeReceivedType(payload));
  }

  const record = payload as Record<string, unknown>;

  function requireString(field: string): string {
    const value = record[field];
    if (typeof value !== 'string') {
      throw boundaryError(boundaryName, `field "${field}" to be a string`, describeReceivedType(value));
    }
    return value;
  }

  return {
    requireString,

    requireNonEmptyString(field: string): string {
      const value = requireString(field);
      if (value.length === 0) {
        throw boundaryError(boundaryName, `field "${field}" to be a non-empty string`, 'an empty string');
      }
      return value;
    },

    requireStringArray(field: string): readonly string[] {
      const value = record[field];
      if (!Array.isArray(value)) {
        throw boundaryError(boundaryName, `field "${field}" to be an array of strings`, describeReceivedType(value));
      }
      if (!value.every((entry): entry is string => typeof entry === 'string')) {
        throw boundaryError(
          boundaryName,
          `every entry of field "${field}" to be a string`,
          'an array with a non-string entry',
        );
      }
      return value;
    },
  };
}
