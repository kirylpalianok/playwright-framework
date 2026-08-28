import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Logger } from '../../core/observability/logging/structured-logger.js';

/**
 * The framework's only HTTP request capability. It exposes safe, repeatable `GET` and
 * `HEAD` requests against the configured public target and nothing else: there is no
 * mutation method, and no catch-all client that would let a test send arbitrary verbs or
 * bodies (see docs/adr/0002-read-only-http-request-capability.md).
 *
 * Base URL, request timeout class, and correlation headers are applied once, when the
 * fixture constructs the underlying `APIRequestContext`; consumers pass a site-relative
 * path only.
 */
export interface ReadOnlyHttpRequests {
  /** Sends a `GET` and returns the response with access to its validated JSON body. */
  get(path: string): Promise<ReadOnlyJsonResponse>;
  /** Sends a `HEAD` and returns the response metadata. `HEAD` responses carry no body. */
  head(path: string): Promise<ReadOnlyHttpResponse>;
}

/** Response metadata a test can assert against, independent of transport details. */
export interface ReadOnlyHttpResponse {
  readonly status: number;
  /** Response headers with lower-cased names, as returned by the transport. */
  readonly headers: Readonly<Record<string, string>>;
  /** The absolute URL the response was served from, after any redirect. */
  readonly url: string;
}

export interface ReadOnlyJsonResponse extends ReadOnlyHttpResponse {
  /**
   * Parses the response body as JSON and hands it to `validate`, which narrows the
   * untrusted payload to a typed result (see `src/api/schemas`). Throws with the status,
   * content type, and a truncated body preview when the body is not valid JSON.
   */
  readJson<T>(validate: (payload: unknown) => T): Promise<T>;
}

export interface ReadOnlyHttpRequestsDependencies {
  /**
   * A request context already configured with the target base URL, the API request
   * timeout class, and correlation headers. Its lifecycle is owned by the caller.
   */
  readonly request: APIRequestContext;
  readonly logger: Logger;
}

type ReadOnlyMethod = 'GET' | 'HEAD';

/**
 * Characters of an unexpected body included in a diagnostic message. Surfacing raw
 * response content in an error is an explicit, recorded exception to CLAUDE.md section 6
 * ("never place [sensitive data] in errors") — see the exception record in
 * docs/adr/0002-read-only-http-request-capability.md, which names its owner, scope, and
 * review date. It is bounded to this constant and to non-JSON bodies from the public,
 * unauthenticated target.
 */
const BODY_PREVIEW_LIMIT = 200;

function describeResponse(response: APIResponse): ReadOnlyHttpResponse {
  return {
    status: response.status(),
    headers: response.headers(),
    url: response.url(),
  };
}

function previewBody(body: string): string {
  const collapsed = body.replace(/\s+/gu, ' ').trim();
  return collapsed.length > BODY_PREVIEW_LIMIT ? `${collapsed.slice(0, BODY_PREVIEW_LIMIT)}…` : collapsed;
}

export function createReadOnlyHttpRequests(
  dependencies: ReadOnlyHttpRequestsDependencies,
): ReadOnlyHttpRequests {
  const { request, logger } = dependencies;

  async function send(method: ReadOnlyMethod, path: string): Promise<APIResponse> {
    const startedAt = Date.now();

    let response: APIResponse;
    try {
      response = method === 'GET' ? await request.get(path) : await request.head(path);
    } catch (error) {
      logger.logOperation({
        operation: 'http-read-request',
        target: `${method} ${path}`,
        outcome: 'failure',
        durationMs: Date.now() - startedAt,
        error,
      });
      throw new Error(
        `${method} ${path} did not complete against the configured base URL. Expected: an HTTP response within the configured API timeout. Actual: the request failed before a response arrived. Next step: confirm the target is reachable and that BASE_URL and API_TIMEOUT_MS are correct for this environment.`,
        { cause: error },
      );
    }

    // A response of any status means the request itself completed. Whether that status is
    // correct is the specification's business outcome to assert — a documented 404 is a
    // passing negative contract — so only the transport failure above is recorded as a
    // failed operation. Classification stays objective and never reports a passing test
    // as unhealthy (CLAUDE.md section 11).
    logger.logOperation({
      operation: 'http-read-request',
      target: `${method} ${path}`,
      outcome: 'success',
      durationMs: Date.now() - startedAt,
      details: {
        status: response.status(),
        contentType: response.headers()['content-type'],
      },
    });

    return response;
  }

  return {
    async get(path: string): Promise<ReadOnlyJsonResponse> {
      const response = await send('GET', path);

      return {
        ...describeResponse(response),

        async readJson<T>(validate: (payload: unknown) => T): Promise<T> {
          const body = await response.text();

          let payload: unknown;
          try {
            payload = JSON.parse(body);
          } catch (error) {
            throw new Error(
              `GET ${path} returned a body that is not valid JSON. Expected: a JSON document. Actual: status ${response.status()}, content-type "${response.headers()['content-type'] ?? 'absent'}", body starts with "${previewBody(body)}". Next step: open the URL directly to see whether the endpoint changed, moved, or is serving an error page.`,
              { cause: error },
            );
          }

          return validate(payload);
        },
      };
    },

    async head(path: string): Promise<ReadOnlyHttpResponse> {
      return describeResponse(await send('HEAD', path));
    },
  };
}
