---
type: Architecture
title: Post-Commit Hook System
description: Manifest-refresh and curation nudge hook; agents write session syntheses to inbox before committing
resource: ./templates/okf/post-commit.sh
tags: [okf, git, hooks, post-commit, manifest, curation-nudge]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# Post-Commit Hook System

The OKF post-commit hook is a minimal bash script that runs after each commit. It does NOT write to the knowledge inbox. Its two responsibilities are refreshing the workspace viewer manifest and nudging for curation when the inbox accumulates. Agents are responsible for writing session syntheses to `knowledge/inbox/` BEFORE committing.

## Installation

The hook is installed by `install-okf.sh` into `.githooks/post-commit` in the project root. The installer sets the local `core.hooksPath` to `.githooks` (not global, to avoid conflicts with other projects). See [Installer Design](./installer-design.md).

## What It Does

### 1. Guard Conditions

The hook exits early (exit 0) in several cases:

- **No knowledge directory:** If `knowledge/` does not exist, the hook does nothing.
- **Curation commits:** If the commit subject starts with `okf-curation:`, the hook exits to prevent loops (a curation commit triggering the hook, which might trigger another curation).

### 2. Manifest Refresh

The hook runs the workspace-level `generate-all-viz.js --manifest` script (if it exists and Node is available) to refresh the viewer manifest so the knowledge graph viewer stays current with the latest concept files. This runs silently (output suppressed, failures tolerated).

### 3. Curation Nudge

The hook counts unprocessed inbox items (`.md` files in `knowledge/inbox/` excluding `index.md`) and prints a reminder when the count reaches a configurable threshold:

```
OKF: <count> unprocessed inbox items in knowledge/inbox/.
     Run a curation pass: dispatch the okf-curator agent or /okf-curate.
```

The threshold defaults to 5 and can be overridden with the `OKF_NUDGE_THRESHOLD` environment variable.

## What It Does NOT Do

The hook does NOT write commit metadata to the inbox. The previous design (writing SHA, author, branch, changed files, and issue refs to `knowledge/inbox/`) was deprecated because it generated low-signal noise, created loop risks, and was redundant with agent-written session syntheses. See [Post-Commit Inbox Capture (Deprecated)](../deprecation/post-commit-inbox-capture.md) for the full lessons.

## Capture Responsibility

Agents write session syntheses to `knowledge/inbox/` before committing, using the OKF inbox format (see [Inbox Format](../domain/inbox-format.md)). These syntheses contain:

- What was done (decisions, changes, rationale)
- Approaches rejected and why
- What was deprecated
- Lessons learned
- Current state

This is far richer than commit metadata alone. The [Post-Commit Capture Model](../decisions/post-commit-capture-model.md) decision documents the rationale for this separation of concerns.

## Curation Pipeline

Inbox items written by agents are processed by the curation agent (see [Curation Pass](../process/curation-pass.md)). The agent reads inbox items, existing concepts, the codebase, and referenced GitHub issues to create or update permanent concept files. The curation nudge in this hook reminds developers when it is time to run a curation pass.

## Edge Cases and `set -e`

The script uses `set -euo pipefail`. Fallbacks handle edge cases:

- `git rev-parse --show-toplevel` falls back to `pwd` if not in a git repo.
- `git log -1 --format='%s'` falls back to an empty string.
- The manifest refresh uses `|| true` to tolerate failures (missing script, no Node, etc.).
- The inbox count uses `find ... 2>/dev/null | wc -l` to tolerate missing directories.
