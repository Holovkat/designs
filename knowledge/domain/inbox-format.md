---
type: Domain
title: OKF Inbox Format
description: Session synthesis format for inbox items with frontmatter and body sections
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, inbox, session-synthesis, format, capture]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# OKF Inbox Format

Inbox items are session syntheses written at commit time or after work sessions. They use the same frontmatter as permanent concepts but with `type: Inbox`. They serve as staging material for the curation agent.

## Two Sources of Inbox Items

1. **Post-commit hook:** Automatically writes lightweight commit metadata (SHA, author, branch, changed files, issue refs extracted from commit subject). See [Hook System](../architecture/hook-system.md).
2. **Agent capture:** After a meaningful work session, an agent writes a full session synthesis using the `/okf-capture` command or manually. This captures richer context: decisions, rationale, lessons learned.

## Frontmatter

```yaml
---
type: Inbox
title: Session 2026-06-29 - Route geometry QA fixes
description: Session synthesis for route geometry work
tags: [mobile, routing, qa]
timestamp: 2026-06-29T10:00:00Z
session_id: 6acfd15b-bdf5-4b4b-9c1b-daff51ff57c0
commit_sha: 5449a3d2
branch: codex/issue-1503
issue_refs: [1503]
epic_refs: [1495]
---
```

### Key Fields

- `type`: Always `Inbox` for inbox items.
- `title`: Descriptive title for the session or commit.
- `description`: One-line summary.
- `tags`: Lowercase, relevant tags for the work area.
- `timestamp`: ISO 8601 datetime.
- `session_id`: UUID of the agent session (for agent-written items).
- `commit_sha`: Short git SHA (for hook-written items).
- `branch`: Branch name.
- `issue_refs`: GitHub issue numbers referenced by the work.
- `epic_refs`: Epic issue numbers.

Not all fields are present in every item. Hook-written items have `commit_sha` and `branch` but not `session_id`. Agent-written items may have both.

## Body Sections

Agent-written session syntheses follow this structure:

### What Was Done
Summary of work completed in this session. What was built, fixed, or changed.

### Decisions Made
Architectural or product decisions and their rationale. Why a particular approach was chosen over alternatives.

### What Was Deprecated
Patterns, components, or approaches that were removed or superseded during the session.

### Lessons Learned
Insights gained during the work. Things that would help future agents avoid mistakes or work more effectively.

### Current State
What works now, what is in progress, what is blocked. A snapshot of the situation after the session.

Hook-written items have a simpler body: commit metadata, changed files list, and a notes placeholder.

## Filename Format

`<ISO-timestamp-with-dashes>-<slugified-title>.md`

The timestamp has colons and periods replaced with dashes, truncated to 19 characters. The slug is the title lowercased with non-alphanumeric characters replaced by hyphens, truncated to 50 characters.

Examples:
- `2026-06-29T10-00-00-route-geometry-qa-fixes.md`
- `2026-06-29T14-22-31-commit` (fallback slug for hook items)

## Lifecycle

1. **Written:** By the post-commit hook or an agent to `knowledge/inbox/`.
2. **Awaiting curation:** Listed in `inbox/index.md`.
3. **Processed:** The curation agent reads the item, creates or updates permanent concepts, then moves the item to `knowledge/inbox/processed/`.
4. **Archived:** Processed items remain in `inbox/processed/` for audit trail purposes.

See [Curation Pass](../process/curation-pass.md) for the full curation workflow.

## Content Focus

Inbox items are about the product, business logic, and application state, not just code diffs. The session synthesis should capture the full context so that another agent reading it knows exactly the current state of play. This is what makes the curation agent effective: it has rich material to work from, not just commit messages.
