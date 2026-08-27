'use strict';

// Shared with .claude/skills/automation-review/SKILL.md's file-category table.
// Keep these patterns in sync whenever that table changes.
const PATTERNS = [
  /tests\/ui\/.*\.spec\.ts$/, // UI test
  /tests\/accessibility\/.*\.spec\.ts$/, // Accessibility test
  /src\/ui\/pages\/.*\.page\.ts$/, // Page object
  /src\/ui\/components\/.*\.component\.ts$/, // UI component
  /tests\/api\/.*\.spec\.ts$/, // API test
  /src\/api\/clients\//, // API client
  /src\/api\/schemas\//, // API schema
  /(^|\/)playwright\.config\.ts$/, // Playwright config
  /src\/core\/fixtures\//, // Fixtures
  /tests\/test-data\/(builders|lifecycle)\//, // Test-data builder/lifecycle
  /(^|\/)tsconfig[^/]*\.json$/, // TypeScript config
  /(^|\/)\.eslintrc[^/]*$/, // Lint config (legacy)
  /(^|\/)eslint\.config\.[^/]+$/, // Lint config (flat)
  /(^|\/)\.prettierrc[^/]*$/, // Format config
  /(^|\/)prettierrc\.[^/]+$/, // Format config
  /\.github\/workflows\/.*\.ya?ml$/, // CI test config
];

function normalize(filePath) {
  return String(filePath).replace(/\\/g, '/');
}

function matchesReviewCategory(filePath) {
  return PATTERNS.some((re) => re.test(normalize(filePath)));
}

module.exports = { matchesReviewCategory, normalize };
