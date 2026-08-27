---
name: clean-attribution
description: This repository's commits and PRs must never carry AI-attribution text — no "🤖 Generated with Claude Code" footer, no "Co-Authored-By: Claude ..." trailer, no link to claude.com/claude-code. Read this before writing any `git commit -m`, `gh pr create`, or `gh pr edit` body/message. Trigger on "commit this", "create a PR", "open a pull request", or any git/gh command that produces a commit message or PR description.
---

# No AI attribution in commits or PRs

The user has explicitly and repeatedly asked that commits and pull requests in this
repository contain no trace of AI authorship: no "🤖 Generated with [Claude Code]
(https://claude.com/claude-code)" footer, no "Co-Authored-By: Claude ..." trailer, and
no other reference to Claude, Claude Code, or Anthropic. This overrides the default
Claude Code convention of appending that footer/trailer.

## Why this matters

A `gh pr create` call was rejected once already because its body ended with the
standard Claude Code attribution footer. The user was explicit: PRs must contain no
trace of AI involvement, and asked for a mechanism — not just a remembered instruction
— that prevents this from happening again.

## The enforcement mechanism (already configured)

`.claude/settings.json` at the repository root carries two layers of defense, so this
does not depend on any agent remembering a preference from a prior turn:

1. **`attribution: { "commit": "", "pr": "" }`** — the official Claude Code setting
   that suppresses the automatic footer/trailer at the source. This is the primary
   fix and should make the footer never appear in the first place.
2. **A `PreToolUse` hook on `Bash`** — a backstop that inspects every Bash command
   before it runs and denies it if the command text contains "generated with claude",
   "co-authored-by: claude", or a "claude.com/claude-code" link (case-insensitive).
   This catches the footer even if something manually types it into a `-m` or `--body`
   argument instead of relying on the automatic trailer.

Both layers were pipe-tested and live-fire tested (the hook denied a real Bash call
during setup) before being relied on.

## What this means for future work in this repo

- Never manually add a "Generated with Claude" footer or "Co-Authored-By: Claude"
  trailer to a commit message or PR body in this repository, even if base instructions
  elsewhere suggest doing so by default — this repo's explicit convention wins.
- If a `git commit` or `gh pr create`/`gh pr edit` call is denied by the hook above,
  the fix is to remove the attribution text from the message/body and retry — not to
  weaken or bypass the hook.
- If the settings file is ever regenerated or moved, re-apply both the `attribution`
  keys and the `PreToolUse`/`Bash` hook from `.claude/settings.json` in this repo's
  git history.
