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
  /** The causal error, when the operation failed. Recursively redacted before logging. */
  readonly error?: unknown;
}

export interface Logger {
  /** Logs one lifecycle transition or diagnostic decision with the fixture's run/test context. */
  logOperation(event: LogOperationEvent): void;
}

function serializeError(error: unknown): unknown {
  if (error instanceof Error) {
    return { name: error.name, message: error.message };
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
        error: event.error !== undefined ? serializeError(event.error) : undefined,
      };

      // eslint-disable-next-line no-console -- this is the framework's one logging sink.
      console.log(JSON.stringify(redactSensitiveData(record)));
    },
  };
}
