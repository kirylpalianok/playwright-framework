import { randomUUID } from 'node:crypto';

/**
 * Creates a fresh, collision-resistant identifier for correlating every log line and
 * reported step to one worker process's execution of the suite. Intended to be produced
 * once per worker by a worker-scoped fixture.
 */
export function createRunId(): string {
  return randomUUID();
}
