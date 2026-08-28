import { defineConfig, devices } from '@playwright/test';
import { loadEnvironmentConfig } from './src/core/config/environment.js';
import type { FrameworkTestOptions } from './src/core/config/framework-test-options.js';

// Playwright config load is the framework's single startup module: configuration is
// validated once here, before any test runs, and injected into the runner via `use`.
const environment = loadEnvironmentConfig();

export default defineConfig<FrameworkTestOptions>({
  testDir: './tests',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  timeout: environment.timeouts.testMs,
  expect: {
    timeout: environment.timeouts.expectationMs,
  },
  use: {
    baseURL: environment.baseUrl,
    actionTimeout: environment.timeouts.actionMs,
    navigationTimeout: environment.timeouts.navigationMs,
    apiRequestTimeoutMs: environment.timeouts.apiRequestMs,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'off',
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['allure-playwright', { outputFolder: 'allure-results' }],
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
