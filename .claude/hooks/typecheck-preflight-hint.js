#!/usr/bin/env node
'use strict';

// PreToolUse hook (matcher: Bash). Soft advisory only — never blocks.
// When the command looks like `git commit`, `git push`, or `gh pr create`,
// runs `npm run typecheck` in practice-automation/ and surfaces the result
// as context, so a broken build is visible before committing/pushing/opening
// a PR without ever denying the command itself.

const { execSync } = require('child_process');
const path = require('path');

const RELEVANT_COMMAND_PATTERN = /\bgit\s+commit\b|\bgit\s+push\b|\bgh\s+pr\s+create\b/;
const PROJECT_DIR = path.resolve(__dirname, '..', '..', 'practice-automation');
const MAX_OUTPUT_CHARS = 2000;

function truncate(text) {
  return text.length > MAX_OUTPUT_CHARS
    ? `${text.slice(0, MAX_OUTPUT_CHARS)}\n... (truncated)`
    : text;
}

let raw = '';
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw);
    if (input?.tool_name !== 'Bash') return process.exit(0);
    const command = input?.tool_input?.command;
    if (!command || typeof command !== 'string') return process.exit(0);
    if (!RELEVANT_COMMAND_PATTERN.test(command)) return process.exit(0);

    let output;
    let passed = true;
    try {
      output = execSync('npm run typecheck', {
        cwd: PROJECT_DIR,
        encoding: 'utf8',
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (err) {
      passed = false;
      output = `${err.stdout || ''}${err.stderr || ''}` || String(err.message || err);
    }

    const summary = passed
      ? 'npm run typecheck passed.'
      : `npm run typecheck FAILED before this commit/push/PR command:\n${truncate(String(output))}`;

    process.stdout.write(
      JSON.stringify({
        systemMessage: passed ? 'typecheck: passed' : 'typecheck: FAILED (see context)',
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: summary,
        },
      }),
    );
  } catch {
    // Advisory-only: never let an internal error here affect the underlying command.
  }
  process.exit(0);
});
