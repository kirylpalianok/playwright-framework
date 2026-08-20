/**
 * Startup configuration boundary. This is the only module permitted to read
 * `process.env` (see AGENTS.md section 6). It validates the target base URL and the
 * framework's central timeout classes once, at Playwright config load time, and hands
 * every consumer a single validated, immutable object instead of raw environment access.
 */

export interface TimeoutsConfig {
  /** Maximum time for a single Playwright action (click, fill, and similar). */
  readonly actionMs: number;
  /** Maximum time for a navigation to complete. */
  readonly navigationMs: number;
  /** Maximum time for a web-first assertion (`expect(...).toBeVisible()` and similar) to resolve. */
  readonly expectationMs: number;
  /** Maximum time for one test, including hooks. */
  readonly testMs: number;
}

export interface EnvironmentConfig {
  /** Base URL of the public practice target under test. */
  readonly baseUrl: string;
  readonly timeouts: TimeoutsConfig;
}

const DEFAULT_BASE_URL = 'https://practice-automation.com';

const DEFAULT_TIMEOUTS: TimeoutsConfig = {
  actionMs: 10_000,
  navigationMs: 15_000,
  expectationMs: 5_000,
  testMs: 30_000,
};

function readBaseUrl(env: NodeJS.ProcessEnv): string {
  const rawValue = env.BASE_URL ?? DEFAULT_BASE_URL;

  let parsed: URL;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error(
      'Invalid configuration for "BASE_URL": expected an absolute URL (for example "https://practice-automation.com").',
    );
  }

  if (parsed.protocol !== 'https:') {
    throw new Error(`Invalid configuration for "BASE_URL": expected an https URL, received protocol "${parsed.protocol}".`);
  }

  return parsed.origin;
}

function readPositiveIntegerMs(env: NodeJS.ProcessEnv, name: string, defaultValue: number): number {
  const rawValue = env[name];
  if (rawValue === undefined) {
    return defaultValue;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid configuration for "${name}": expected a positive integer number of milliseconds.`);
  }

  return parsed;
}

/**
 * Loads and validates the framework's environment configuration. Every setting is
 * optional and falls back to a safe default for the public practice target, so the
 * framework runs without any `.env` file. Throws before test execution starts when a
 * provided value is malformed.
 */
export function loadEnvironmentConfig(env: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
  const baseUrl = readBaseUrl(env);

  const timeouts: TimeoutsConfig = {
    actionMs: readPositiveIntegerMs(env, 'ACTION_TIMEOUT_MS', DEFAULT_TIMEOUTS.actionMs),
    navigationMs: readPositiveIntegerMs(env, 'NAVIGATION_TIMEOUT_MS', DEFAULT_TIMEOUTS.navigationMs),
    expectationMs: readPositiveIntegerMs(env, 'EXPECT_TIMEOUT_MS', DEFAULT_TIMEOUTS.expectationMs),
    testMs: readPositiveIntegerMs(env, 'TEST_TIMEOUT_MS', DEFAULT_TIMEOUTS.testMs),
  };

  return { baseUrl, timeouts };
}
