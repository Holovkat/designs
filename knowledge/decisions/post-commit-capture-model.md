---
type: Decision
title: Post-Commit Capture Model
description: Capture commits via lightweight post-commit hook to inbox rather than real-time curation
resource: ./templates/okf/post-commit.sh
tags: [okf, hooks, capture, inbox, separation-of-concerns]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Decision: Post-Commit Capture Model

## Context

OKF needs to capture knowledge from development work. Two approaches were considered: real-time curation at commit time (the hook would analyse the commit and create/update concepts immediately) or a two-phase model (the hook writes lightweight metadata to the inbox, and a separate curation pass processes it later).

## Decision

Use a two-phase capture model:
1. **Commit time:** The post-commit hook writes lightweight commit metadata to `knowledge/inbox/`.
2. **Curation time:** A separate curation pass (triggered by `/okf-curate` or the okf-curator droid) processes inbox items into permanent concept files.

## Rationale

- **Hook must be fast:** Git hooks run on every commit. If the hook is slow (e.g., it calls AI APIs, fetches GitHub issues, reads the entire codebase), it degrades the developer experience and may cause commits to appear to hang.
- **Curation needs full context:** To create a good concept, the curation agent needs the full session context, existing concepts, codebase state, and GitHub issue details. This is too heavy for a commit hook.
- **Separation of concerns:** The hook's job is to record what happened. The curation agent's job is to understand what it means. Mixing these concerns would produce a hook that is both slow and produces low-quality concepts.
- **Batch processing:** Curation can process multiple inbox items at once, synthesising across commits to create coherent concepts. Real-time curation would create one concept per commit, leading to fragmentation.
- **On-demand scheduling:** Curation can be scheduled (e.g., nightly) or triggered on-demand. It does not need to run on every commit.

## What the Hook Captures

The hook captures only metadata:
- Commit SHA, subject, author, branch, timestamp
- Changed files list
- Issue refs extracted from commit subject (`#[0-9]+` pattern)

This is written to `knowledge/inbox/` as an Inbox-type markdown file. See [Hook System](../architecture/hook-system.md) and [Inbox Format](../domain/inbox-format.md).

## What Curation Adds

The curation agent enriches the hook's metadata with:
- Full session context (from agent-written inbox items)
- GitHub issue content (fetched via `gh issue view`)
- Existing concept files (to merge or supersede)
- Codebase and git history analysis
- Cross-links to related concepts

See [Curation Pass](../process/curation-pass.md).

## Alternatives Considered

- **Real-time curation in the hook:** The hook would call an AI API to generate concepts immediately. Rejected because hooks must be fast, and AI calls are slow and may fail.
- **No hook, manual capture only:** Agents write inbox items manually after sessions. Rejected because it misses commits that happen without an agent session (e.g., human developers).
- **Pre-commit hook:** Use a pre-commit hook instead of post-commit. Rejected because pre-commit hooks can block commits if they fail, and knowledge capture should never block development.
