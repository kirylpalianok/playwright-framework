#!/usr/bin/env node
'use strict';

// PostToolUse hook (matcher: Write|Edit). Silent bookkeeping only — never
// blocks, never prints a reason. It just records which automation-review
// categories were touched this session so the Stop hook
// (automation-review-stop-gate.js) can trigger one batched review instead
// of nudging on every single Write/Edit.

const { matchesReviewCategory, normalize } = require('./lib/review-patterns');
const { readState, writeState } = require('./lib/state');

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

  const filePath = input?.tool_input?.file_path || input?.tool_response?.filePath;
  const sessionId = input?.session_id;
  if (!filePath || !sessionId) process.exit(0);
  if (!matchesReviewCategory(filePath)) process.exit(0);

  const normalized = normalize(filePath);
  const state = readState(sessionId);
  if (!state.pending.includes(normalized)) {
    state.pending.push(normalized);
    // A newly touched file changes the pending set, so any earlier
    // "already nudged for this exact set" bookkeeping is stale now.
    state.lastBlockedHash = null;
    state.attemptsForHash = 0;
    writeState(sessionId, state);
  }
  process.exit(0);
});
