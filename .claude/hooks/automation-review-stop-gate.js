#!/usr/bin/env node
'use strict';

// Stop hook. Fires once per turn-end (not per edit). If track-touched-file.js
// recorded automation-review-relevant files this session that haven't been
// reviewed yet, block the stop with a batched instruction to run the
// "automation-review" skill on exactly that file set.
//
// Forcing is best-effort, not a hard gate: it nudges up to MAX_ATTEMPTS times
// for the same unchanged file set, then gives up (clears the queue and
// leaves a non-blocking note) so a stuck session can never be trapped in an
// infinite Stop-block loop.

const { readState, writeState, hashList } = require('./lib/state');

const MAX_ATTEMPTS = 2;

let raw = '';
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let input = {};
  try {
    input = JSON.parse(raw);
  } catch {
    // Some Stop invocations may carry little/no stdin; proceed with {}.
  }

  const sessionId = input?.session_id;
  if (!sessionId) process.exit(0);

  const state = readState(sessionId);
  if (state.pending.length === 0) process.exit(0);

  const hash = hashList(state.pending);
  if (hash !== state.lastBlockedHash) {
    state.lastBlockedHash = hash;
    state.attemptsForHash = 1;
  } else {
    state.attemptsForHash += 1;
  }
  writeState(sessionId, state);

  if (state.attemptsForHash > MAX_ATTEMPTS) {
    const files = state.pending.slice();
    writeState(sessionId, { pending: [], lastBlockedHash: null, attemptsForHash: 0 });
    process.stdout.write(
      JSON.stringify({
        systemMessage: `automation-review was not run for ${files.length} changed file(s) after ${MAX_ATTEMPTS} reminders — proceeding without it: ${files.join(', ')}`,
      }),
    );
    process.exit(0);
  }

  const fileList = state.pending.map((f) => `- ${f}`).join('\n');
  const reason =
    `The following automation code changed this turn and has not been reviewed yet:\n${fileList}\n\n` +
    `Before ending your turn, invoke the "automation-review" skill (Skill tool) scoped to exactly these ` +
    `files, and report its findings to the user.`;

  process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  process.exit(0);
});
