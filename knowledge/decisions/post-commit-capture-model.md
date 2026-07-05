---
type: Decision
title: Post-Commit Capture Model
description: Two-phase knowledge capture: agents write session syntheses to inbox before committing, hook refreshes manifest and nudges, curation pass processes later
resource: ./templates/okf/post-commit.sh
tags: [okf, hooks, capture, inbox, separation-of-concerns, agents]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# Decision: Post-Commit Capture Model

## Context

OKF needs to capture knowledge from development work. The original design used a two-phase model where the post-commit hook wrote lightweight commit metadata to the inbox and a separate curation pass processed it later. This was revised in 2026-07-05: the hook no longer writes to the inbox (see [Post-Commit Inbox Capture (Deprecated)](../deprecation/post-commit-inbox-capture.md) for the lessons), and agents now write session syntheses before committing.

## Decision

Use a two-phase capture model:
1. **Commit time (agent responsibility):** Agents write session syntheses to `knowledge/inbox/` BEFORE committing. The synthesis captures what was done, decisions made, approaches rejected, lessons learned, and current state. The post-commit hook refreshes the viewer manifest and nudges for curation when the inbox accumulates.
2. **Curation time (separate pass):** A curation pass (triggered by the okf-curator droid or `/okf-curate`) processes inbox items into permanent concept files with full context.

## Rationale

- **Hook must be fast:** Git hooks run on every commit. If the hook is slow (e.g., it calls AI APIs, fetches GitHub issues, reads the entire codebase), it degrades the developer experience and may cause commits to appear to hang.
- **Curation needs full context:** To create a good concept, the curation agent needs the full session context, existing concepts, codebase state, and GitHub issue details. This is too heavy for a commit hook.
- **Separation of concerns:** Agents capture context (they have the session context). The hook maintains tooling (manifest refresh + nudge). The curation agent produces concepts. Each has one job.
- **Batch processing:** Curation can process multiple inbox items at once, synthesising across sessions to create coherent concepts.
- **On-demand scheduling:** Curation is triggered by a passive nudge when the inbox reaches a threshold (default 5), or after any significant epic closes. It does not need to run on every commit.

## Evolution From the Original Model

The original model had the hook write commit metadata (SHA, subject, author, branch, changed files, issue refs) to the inbox. This was deprecated because:

- Hook-written stubs were low-signal (what changed, not why) and added curation overhead.
- Agent-written syntheses are far richer (decisions, rationale, rejected approaches, lessons).
- The hook writing to the inbox created loop risks and duplicate-prevention complexity.
- Four documents drifted from the tooling after the hook changed, demonstrating the fragility of coupling git mechanics to knowledge capture.

See [Post-Commit Inbox Capture (Deprecated)](../deprecation/post-commit-inbox-capture.md) for the full lessons.

## What the Hook Does Now

The post-commit hook:
1. Skips if no knowledge directory or if the commit is a curation commit (`okf-curation:` prefix).
2. Refreshes the workspace viewer manifest (silently, failures tolerated).
3. Nudges for curation when unprocessed inbox items reach the threshold (default 5).

See [Hook System](../architecture/hook-system.md) for the full architecture.

## What Curation Adds

The curation agent enriches agent-written syntheses with:
- GitHub issue content (fetched via `gh issue view`)
- Existing concept files (to merge or supersede)
- Codebase and git history analysis
- Cross-links to related concepts
- Audit of the existing bundle (redundancy, contradictions, ambiguous references, AGENTS.md alignment)

See [Curation Pass](../process/curation-pass.md) and [Curation Audit and Nudge](./curation-audit-and-nudge.md).

## Alternatives Considered

- **Real-time curation in the hook:** The hook would call an AI API to generate concepts immediately. Rejected because hooks must be fast, and AI calls are slow and may fail.
- **Hook writes metadata stubs (original model):** The hook wrote lightweight commit metadata to the inbox. Deprecated because stubs were low-signal, created loop risks, and were redundant with agent-written syntheses. See [deprecation entry](../deprecation/post-commit-inbox-capture.md).
- **No hook, manual capture only:** Agents write inbox items manually after sessions, no hook at all. Rejected because the manifest refresh and curation nudge provide valuable tooling automation.
- **Pre-commit hook:** Use a pre-commit hook instead of post-commit. Rejected because pre-commit hooks can block commits if they fail, and knowledge capture should never block development.
