'use strict';

// Per-session bookkeeping for the automation-review batch trigger.
// Lives entirely outside the repo working tree (OS temp dir) so it can
// never end up staged or committed by accident.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const STATE_DIR = path.join(os.tmpdir(), 'claude-automation-review-hook');

function statePath(sessionId) {
  const safeId = String(sessionId || 'unknown-session').replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(STATE_DIR, `${safeId}.json`);
}

function readState(sessionId) {
  try {
    const parsed = JSON.parse(fs.readFileSync(statePath(sessionId), 'utf8'));
    return {
      pending: Array.isArray(parsed.pending) ? parsed.pending : [],
      lastBlockedHash: parsed.lastBlockedHash || null,
      attemptsForHash: Number.isFinite(parsed.attemptsForHash) ? parsed.attemptsForHash : 0,
    };
  } catch {
    return { pending: [], lastBlockedHash: null, attemptsForHash: 0 };
  }
}

function writeState(sessionId, state) {
  try {
    fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(statePath(sessionId), JSON.stringify(state), 'utf8');
  } catch {
    // Best-effort bookkeeping only; never let this break the hook.
  }
}

function hashList(list) {
  return crypto.createHash('sha1').update(JSON.stringify([...list].sort())).digest('hex');
}

module.exports = { readState, writeState, hashList };
