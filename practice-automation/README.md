# Practice Automation

Production-ready Playwright and TypeScript automation framework. It exercises the
public practice target at https://practice-automation.com by default; see
[docs/operations/configuration.md](docs/operations/configuration.md) to point it
elsewhere.

## Prerequisites

- Node.js 22 or later
- npm 10 or later

## Setup

```bash
npm install
npx playwright install
```

No `.env` file is required: every setting has a safe default (see
[docs/operations/configuration.md](docs/operations/configuration.md)).

## Common commands

```bash
npm run check
npm test
npm run test:ui
npm run test:api
npm run test:smoke
npm run report:open
```

## First run

After setup, run `npm run check` to typecheck and list the suite, then `npm run
test:smoke` to run the smoke tests. This exercises one UI behavior (opening the
JavaScript Delays exercise from the practice catalogue) and one API contract (the
WordPress REST discovery endpoint at `/wp-json/`) against the live public target.

## Reports

Every test command writes Playwright's own HTML report to `playwright-report/` and
Allure results to `allure-results/`. `npm run report:open` builds `allure-report/`
from those results and serves it; `npm run report:generate` builds it without
serving. Both use the bundled Allure CLI, so no separate installation and no Java
runtime is required.

Each test command clears `allure-results/` and `allure-report/` before it runs, so a
report always describes the run that produced it rather than accumulating earlier
sessions. Running two selections in sequence therefore reports only the second one;
use `npm test` when you need a single report covering the whole suite.
