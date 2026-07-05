---
type: Domain
title: OKF Inbox Format
description: Session synthesis format for inbox items with frontmatter and body sections
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, inbox, session-synthesis, format, capture]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# OKF Inbox Format

Inbox items are session syntheses written by agents before committing. They use the same frontmatter as permanent concepts but with `type: Inbox`. They serve as staging material for the curation agent.

## Source of Inbox Items

Inbox items are written by agents. After a meaningful work session, an agent writes a full session synthesis to `knowledge/inbox/` BEFORE committing, using the OKF inbox format (or manually). The synthesis captures richer context than commit metadata alone: decisions, rationale, approaches rejected, lessons learned, and current state.

> **Note:** The post-commit hook previously wrote lightweight commit metadata stubs to the inbox. This was deprecated because the stubs were low-signal and redundant with agent-written syntheses. The hook now only refreshes the viewer manifest and nudges for curation. See [Post-Commit Inbox Capture (Deprecated)](../deprecation/post-commit-inbox-capture.md) and [Hook System](../architecture/hook-system.md).

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
- `title`: Descriptive title for the session.
- `description`: One-line summary.
- `tags`: Lowercase, relevant tags for the work area.
- `timestamp`: ISO 8601 datetime.
- `session_id`: UUID of the agent session.
- `commit_sha`: Short git SHA (optional, when the session produced a specific commit).
- `branch`: Branch name.
- `issue_refs`: GitHub issue numbers referenced by the work.
- `epic_refs`: Epic issue numbers.

Not all fields are present in every item. Agent-written items typically have `session_id`, `branch`, and optionally `commit_sha` and `issue_refs`.

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

All inbox items are agent-written and follow the full body structure above.

## Filename Format

`<ISO-timestamp-with-dashes>-<slugified-title>.md`

The timestamp has colons and periods replaced with dashes, truncated to 19 characters. The slug is the title lowercased with non-alphanumeric characters replaced by hyphens, truncated to 50 characters.

Examples:
- `2026-06-29T10-00-00-route-geometry-qa-fixes.md`
- `2026-07-05T11-00-00Z-skill-effectiveness-review-and-canonicalisation.md`

## Lifecycle

1. **Written:** By an agent to `knowledge/inbox/` before committing.
2. **Awaiting curation:** Listed in `inbox/index.md`.
3. **Processed:** The curation agent reads the item, creates or updates permanent concepts, then moves the item to `knowledge/inbox/processed/`.
4. **Archived:** Processed items remain in `inbox/processed/` for audit trail purposes.

See [Curation Pass](../process/curation-pass.md) for the full curation workflow.

## Content Focus

Inbox items are about the product, business logic, and application state, not just code diffs. The session synthesis should capture the full context so that another agent reading it knows exactly the current state of play. This is what makes the curation agent effective: it has rich material to work from, not just commit messages.
