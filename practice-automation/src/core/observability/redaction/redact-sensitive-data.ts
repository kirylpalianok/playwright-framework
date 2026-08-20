const REDACTED_PLACEHOLDER = '[REDACTED]';

const SENSITIVE_KEY_PATTERN = /authorization|cookie|password|token|secret|api[-_]?key/i;

/**
 * Recursively replaces values behind sensitive keys (authorization headers, cookies,
 * passwords, tokens, secrets, and API keys) with a fixed placeholder. Used before any
 * value leaves the process as a log line, Allure attachment, or error message.
 */
export function redactSensitiveData(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => redactSensitiveData(entry));
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? REDACTED_PLACEHOLDER : redactSensitiveData(entryValue),
      ]),
    );
  }

  return value;
}
