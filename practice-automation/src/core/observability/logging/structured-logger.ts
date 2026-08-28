import { redactSensitiveData } from '../redaction/redact-sensitive-data.js';

export interface LogContext {
  readonly runId: string;
  readonly testId: string;
}

export type LogOutcome = 'success' | 'failure';

export interface LogOperationEvent {
  /** The lifecycle transition or diagnostic decision being recorded, in business language. */
  readonly operation: string;
  /** A safe identifier for the thing the operation acted on (a path, exercise name, and similar). */
  readonly target?: string;
  readonly outcome: LogOutcome;
  readonly durationMs?: number;
  /**
   * Additional safe, queryable context for this operation, such as an HTTP status or
   * content type. Recursively redacted before logging; never a request/response body.
   */
  readonly details?: Readonly<Record<string, unknown>>;
  /** The causal error, when the operation failed. Recursively redacted before logging. */
  readonly error?: unknown;
}

export interface Logger {
  /** Logs one lifecycle transition or diagnostic decision with the fixture's run/test context. */
  logOperation(event: LogOperationEvent): void;
}

/**
 * Playwright appends a call log to its own errors, listing the outgoing request headers
 * as free text inside `message`. Recursive redaction matches object *keys*, so it cannot
 * sanitize header values embedded in a string; the message is truncated at the call-log
 * marker instead. The complete error, call log included, still reaches the Playwright
 * report and the `cause` chain — it is only kept out of collected log lines.
 */
const CALL_LOG_MARKER = '\nCall log:';

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    const callLogIndex = error.message.indexOf(CALL_LOG_MARKER);
    const message =
      callLogIndex === -1
        ? error.message
        : `${error.message.slice(0, callLogIndex)} [call log omitted from logs; see the test report]`;

    return { name: error.name, message };
  }
  return error;
}

/**
 * Creates the framework's single structured logging abstraction, bound to one test's
 * run/test identifiers. Every emitted record is a redacted, single-line JSON object with
 * stable fields, safe to collect from CI output.
 */
export function createLogger(context: LogContext): Logger {
  return {
    logOperation(event: LogOperationEvent): void {
      const record = {
        timestamp: new Date().toISOString(),
        runId: context.runId,
        testId: context.testId,
        operation: event.operation,
        target: event.target,
        outcome: event.outcome,
        durationMs: event.durationMs,
        details: event.details,
        error: event.error !== undefined ? serializeError(event.error) : undefined,
      };

      // eslint-disable-next-line no-console -- this is the framework's one logging sink.
      console.log(JSON.stringify(redactSensitiveData(record)));
    },
  };
}
