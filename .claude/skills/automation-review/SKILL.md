---
name: automation-review
description: Review new or modified automation code in the practice-automation Playwright + TypeScript framework — UI tests, page objects, UI components, API tests, API clients, playwright.config.ts, fixtures, test-data builders, tsconfig.json, ESLint/Prettier config, and CI test workflows — against the conventions in CLAUDE.md and docs/architecture.md. Classifies every finding as BLOCKER, HIGH, MEDIUM, or LOW and never edits files. Trigger on "review this PR/diff/branch", "review my test/page object/fixture/API client/config", "check this against our conventions", or "automation code review". Also invoke it proactively, without being asked, after writing or modifying any of those files (a backlog story, bug fix, or refactor) and before reporting that work complete; a typecheck and a passing suite prove the code runs, not that it conforms.
---

# Automation code review

Read-only review of Playwright/TypeScript automation code against this repository's own written standard. Never modifies, formats, or fixes anything — it only reports findings. Never touches the application-under-test's production code; this repository has none (it is a test framework), and this skill's job is limited to reviewing framework/test code.

## Source of truth

Treat these as normative, in this order of authority when they conflict:

1. `practice-automation/CLAUDE.md` — the repository's mandatory engineering standard.
2. `practice-automation/docs/architecture.md` — practical map of directory responsibilities and dependency direction; does not override CLAUDE.md.
3. Adjacent, already-reviewed code in the same directory — for stylistic conventions not written down explicitly.

Read both `CLAUDE.md` and `docs/architecture.md` at the start of every review (they change over time — do not rely on a prior summary of them). Quote or paraphrase the specific rule a finding violates rather than asserting a bare opinion.

## Determining review scope

- If the user names specific files or a PR/branch, review exactly that set.
- Otherwise, review the current diff: uncommitted + staged changes (`git status`, `git diff HEAD`), and if the tree is clean, the diff between the current branch and its merge base with `main`.
- Resolve the scope with a couple of read-only git commands yourself before asking the user; ask only if the repository has no changes anywhere to review.
- Classify every changed/reviewed file into one of the categories below by its path and role — a file can match more than one category (e.g. a fixture file that also touches config).

| Category | Typical path |
| --- | --- |
| UI test | `tests/ui/**/*.spec.ts`, `tests/accessibility/**/*.spec.ts` |
| Page object | `src/ui/pages/**/*.page.ts` |
| UI component | `src/ui/components/**/*.component.ts` |
| API test | `tests/api/**/*.spec.ts` |
| API client | `src/api/clients/**` |
| API schema | `src/api/schemas/**` |
| Playwright config | `playwright.config.ts` |
| Fixtures | `src/core/fixtures/**` |
| Test-data builder/lifecycle | `tests/test-data/builders/**`, `tests/test-data/lifecycle/**` |
| TypeScript config | `tsconfig*.json` |
| Lint/format config | `.eslintrc*`, `eslint.config.*`, `.prettierrc*`, `prettierrc.*` |
| CI test config | `.github/workflows/**` |

## Review process

1. Read the source-of-truth docs and skim adjacent unchanged code in the same directories for local convention.
2. Load `references/checklist.md` and apply the entries for each category present in scope, plus the cross-cutting checks (locator quality, web-first assertions, synchronization, isolation, fixture design, Page Object responsibilities, assertion placement, TypeScript quality, config safety, unnecessary abstraction/duplication, architectural dependency direction, flaky-test risk, secrets/security).
3. For every rule violation found, capture: exact file and location (line number or symbol), the problem, why it matters (concrete failure mode — flakiness, false confidence, security exposure, maintenance cost), and a specific recommended fix. Do not apply the fix.
4. Assign severity using the rubric below. When a finding could plausibly sit at two levels, pick the higher one and say why in one clause.
5. Deduplicate: one finding per root cause, even if it recurs across several lines/files — list the representative locations together rather than repeating the same problem N times.
6. If a file category has no matching CLAUDE.md/architecture.md rule (e.g. a genuinely new pattern), say so explicitly instead of inventing a rule.

## Severity rubric

- **BLOCKER** — violates a hard `MUST`/`MUST NOT` in a way that produces a false-positive/false-negative test result, leaks a secret or PII, or breaks parallel-safety/test isolation. Must be fixed before merge.
- **HIGH** — violates a `MUST`/`MUST NOT` or an unwaived `SHOULD` with a credible, direct path to flakiness, a wrong architectural dependency, or a maintainability trap (e.g. business logic in a hook, brittle selector, missing web-first assertion on a consequential action, fixed sleep). Should be fixed before merge.
- **MEDIUM** — violates a `SHOULD`/`SHOULD NOT` with a less direct or lower-probability impact, or a design smell that will cost time later (e.g. a one-method wrapper, a borderline abstraction, unclear naming, a config change without a documented rationale).
- **LOW** — style, consistency, or documentation gaps with no functional or architectural risk (e.g. naming polish, a missed doc update for a non-behavioral change, a `MAY`-level suggestion).

## Output format

Report findings grouped by severity, most severe group first; inside a group, order by file path. For each finding:

```
### [SEVERITY] <short title>
- File: <path>:<line or symbol>
- Problem: <what is wrong>
- Why it matters: <concrete consequence>
- Recommended fix: <specific, actionable change — not applied>
```

End with a one-line summary count per severity, and explicitly note any changed file or category you could not review (and why) so coverage gaps are visible rather than silent.

## Constraints

- Never edit, format, or run-fix any file. This is a report-only skill.
- Never run destructive or state-changing commands (no `git add`/`commit`/`push`, no test execution that mutates environments). Read-only git/inspection commands are fine.
- Never modify or propose inline diffs for production/application code — this repository has none to touch; stay within the automation framework's own source.
- If asked to also apply the fixes, decline within this skill and say the user should ask for that as a separate, explicit step.
