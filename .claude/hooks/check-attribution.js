#!/usr/bin/env node
'use strict';

// PreToolUse hook (matcher: Bash). Denies any command that would embed
// Claude Code AI-attribution text in a commit message or PR body — whether
// that text is inline in the command itself (the common case: a heredoc
// passed to `-m`/`--body`) or lives in a separate file referenced via
// `git commit -F <file>` / `git commit --file <file>` /
// `gh pr create|edit --body-file <file>`.
//
// Fail-closed: if a file-based message is detected but the referenced file
// cannot be resolved and read, the command is denied rather than silently
// let through unverified.

const fs = require('fs');
const path = require('path');

const ATTRIBUTION_PATTERN =
  /generated with claude|co-authored-by:\s*claude|claude\.com\/claude-code/i;

const FILE_FLAG_PATTERN =
  /(?:^|\s)(?:-F|--file|--body-file)\s+(?:"([^"]+)"|'([^']+)'|(\S+))/;

const COMMIT_MESSAGE_COMMAND_PATTERN = /\bgit\s+commit\b|\bgh\s+pr\s+(?:create|edit)\b/;

function deny(reason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  process.exit(0);
}

function resolveCandidates(rawPath) {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const candidates = [
    path.isAbsolute(rawPath) ? rawPath : null,
    path.resolve(process.cwd(), rawPath),
    path.resolve(projectRoot, rawPath),
    path.resolve(projectRoot, 'practice-automation', rawPath),
  ].filter(Boolean);
  return [...new Set(candidates)];
}

let raw = '';
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  if (input?.tool_name !== 'Bash') process.exit(0);
  const command = input?.tool_input?.command;
  if (!command || typeof command !== 'string') process.exit(0);

  // Inline case: attribution text typed/heredoc'd directly into the command.
  if (ATTRIBUTION_PATTERN.test(command)) {
    deny(
      'Blocked: this command embeds Claude Code AI-attribution text (a Generated-with-Claude footer, ' +
        'a Co-Authored-By: Claude trailer, or a claude.com/claude-code link). This repository forbids ' +
        'AI attribution in commit messages and PR bodies -- remove it and retry without it.',
    );
    return;
  }

  // File-based case: git commit -F/--file <file>, gh pr create/edit --body-file <file>.
  if (COMMIT_MESSAGE_COMMAND_PATTERN.test(command)) {
    const fileMatch = command.match(FILE_FLAG_PATTERN);
    if (fileMatch) {
      const rawPath = fileMatch[1] || fileMatch[2] || fileMatch[3];
      const candidates = resolveCandidates(rawPath);
      const resolved = candidates.find((p) => {
        try {
          return fs.statSync(p).isFile();
        } catch {
          return false;
        }
      });

      if (!resolved) {
        deny(
          `Blocked: this command reads its commit/PR message from a file (${rawPath}) whose content ` +
            'this hook could not resolve and verify. This repository forbids AI attribution in commit ' +
            'messages and PR bodies, and this file-based form cannot be checked -- inline the message ' +
            'instead (e.g. -m/--body with a heredoc) so it can be verified, or retry once the file exists.',
        );
        return;
      }

      let content;
      try {
        content = fs.readFileSync(resolved, 'utf8');
      } catch {
        deny(
          `Blocked: this command reads its commit/PR message from ${resolved}, which this hook could ` +
            'not read to verify. This repository forbids AI attribution in commit messages and PR ' +
            'bodies -- inline the message instead so it can be verified.',
        );
        return;
      }

      if (ATTRIBUTION_PATTERN.test(content)) {
        deny(
          `Blocked: ${resolved} (used as the commit/PR message via -F/--file/--body-file) contains ` +
            'Claude Code AI-attribution text. This repository forbids AI attribution in commit messages ' +
            'and PR bodies -- remove it from that file and retry.',
        );
        return;
      }
    }
  }

  process.exit(0);
});
