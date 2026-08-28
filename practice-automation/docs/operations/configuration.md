# Configuration reference

`src/core/config/environment.ts` is the single startup module allowed to read
`process.env` (CLAUDE.md section 6). It is loaded once, from `playwright.config.ts`,
before any test runs, and every setting is optional: unset values fall back to a safe
default for the public practice target, so the framework runs with no `.env` file. A
malformed value throws before test execution starts, naming the invalid setting.

| Name | Purpose | Required | Safe example | Default | Sensitivity | Environments |
| --- | --- | --- | --- | --- | --- | --- |
| `BASE_URL` | Base URL of the target under test. Must be an absolute `https` URL. | No | `https://practice-automation.com` | `https://practice-automation.com` | Not sensitive (public target) | All |
| `ACTION_TIMEOUT_MS` | Central action timeout class (click, fill, and similar), in milliseconds. | No | `10000` | `10000` | Not sensitive | All |
| `NAVIGATION_TIMEOUT_MS` | Central navigation timeout class, in milliseconds. | No | `15000` | `15000` | Not sensitive | All |
| `EXPECT_TIMEOUT_MS` | Central web-first assertion timeout class, in milliseconds. | No | `5000` | `5000` | Not sensitive | All |
| `TEST_TIMEOUT_MS` | Central per-test timeout class (including hooks), in milliseconds. | No | `30000` | `30000` | Not sensitive | All |
| `API_TIMEOUT_MS` | Central API request timeout class for the read-only HTTP capability, in milliseconds. | No | `15000` | `15000` | Not sensitive | All |

Raising a timeout requires an exception record proving a legitimately slower contract
(CLAUDE.md section 10); do not raise these to mask flakiness.

`API_TIMEOUT_MS` reaches test-scoped fixtures as the typed Playwright option
`apiRequestTimeoutMs` (`src/core/config/framework-test-options.ts`), which
`playwright.config.ts` sets from the validated configuration. Fixtures read the option;
they never read the environment variable
(see [ADR 0002](../adr/0002-read-only-http-request-capability.md)).

No credential, token, or environment-specific secret is configured today: the target is
a public, read-only practice site. When a future story introduces one, add it to this
table with its sensitivity classification and update `.env.example` with a safe
placeholder — never a real value.
