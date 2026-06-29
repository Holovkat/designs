# OKF Standard v0.1

The Open Knowledge Format (OKF) defines a convention for maintaining project knowledge as markdown files with structured frontmatter, stored in git alongside code.

## Design Principles

1. **Git is canonical.** All knowledge lives in markdown files committed to the project repo. No external system is the source of truth.
2. **Agents read first.** Before starting work, agents read the OKF bundle to understand current state, architecture, and prior decisions.
3. **Two-phase capture.** Commit-time writes lightweight session syntheses to an inbox. A curation pass later upserts permanent concept files with full context.
4. **Progressive disclosure.** Index files at each level provide summaries. Agents read the index, then drill into specific concepts only when relevant.
5. **Deprecation is explicit.** When a concept is superseded, the old file is moved to `deprecation/` with a `supersedes` link, not deleted.

## Directory Structure

Each project repo gets a `knowledge/` directory:

```
knowledge/
├── index.md              # Root index, lists all concept groups
├── log.md                # Chronological history of knowledge updates
├── inbox/                # Staging area for commit-time captures
│   ├── index.md
│   └── <timestamp>-<slug>.md
├── architecture/         # How the system is structured
│   ├── index.md
│   └── *.md
├── components/           # UI components and their behavior
│   ├── index.md
│   └── *.md
├── domain/               # Business logic and domain knowledge
│   ├── index.md
│   └── *.md
├── decisions/            # Architectural decisions and rationale
│   ├── index.md
│   └── *.md
├── process/              # How workflows operate
│   ├── index.md
│   └── *.md
├── deprecation/          # What was removed/superseded and why
│   ├── index.md
│   └── *.md
└── state/                # Current state of play
    ├── index.md
    └── *.md
```

## Concept Types

The `type` field in frontmatter determines which directory a concept belongs to:

| Type | Directory | Description |
|------|-----------|-------------|
| `Architecture` | `architecture/` | How the system is structured (data models, provider hierarchy, infrastructure) |
| `Component` | `components/` | UI components and their behavior |
| `Domain` | `domain/` | Business logic and domain knowledge |
| `Decision` | `decisions/` | Architectural decisions and why they were made |
| `Process` | `process/` | How workflows operate (sprint flow, deployment gates, UAT) |
| `Deprecation` | `deprecation/` | What was removed/superseded and why |
| `State` | `state/` | Current state of play (what works, what's in progress, what's blocked) |
| `Inbox` | `inbox/` | Staging items awaiting curation |

## Frontmatter Specification

All OKF files use YAML frontmatter:

```yaml
---
type: Architecture              # REQUIRED - one of the concept types above
title: SpacetimeDB Tenant Model  # Recommended - human-readable title
description: One-line summary     # Recommended - short description
resource: ./src/db/schema.ts     # Recommended - link to code, issue, or resource
tags: [backend, spacetime-db]    # Recommended - searchable tags
timestamp: 2026-06-29T10:00:00Z # Recommended - ISO 8601 creation/update time
# Extension fields:
status: active                   # active | deprecated | in-progress | blocked
supersedes: [old-pattern.md]     # Links to concepts this replaces
issue_refs: [1503]               # GitHub/GitLab issue numbers
epic_refs: [1495]                # Epic issue numbers
session_id: <uuid>               # Session that produced this knowledge
commit_sha: 5449a3d2             # Commit that triggered the capture
branch: codex/issue-1503         # Branch context
---
```

### Required Fields

- `type` - must be one of the eight concept types

### Recommended Fields

- `title` - human-readable title for index listings
- `description` - one-line summary for index listings and search
- `resource` - URI to the related code file, issue, or external resource
- `tags` - array of lowercase strings for search and filtering
- `timestamp` - ISO 8601 datetime of creation or last update

### Extension Fields

Any additional YAML fields are allowed. Common extensions:
- `status` - lifecycle state of the concept
- `supersedes` - array of filenames this concept replaces (used in deprecation/)
- `issue_refs` / `epic_refs` - ticket references for traceability
- `session_id` / `commit_sha` / `branch` - provenance for inbox items

## Inbox Item Format

Inbox items are session syntheses written at commit time. They use the same frontmatter as permanent concepts but with `type: Inbox`:

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

# What Was Done
Summary of work completed in this session.

# Decisions Made
Architectural or product decisions and their rationale.

# What Was Deprecated
Patterns, components, or approaches that were removed or superseded.

# Lessons Learned
Insights gained during the work.

# Current State
What works now, what's in progress, what's blocked.
```

## Index File Format

Each directory contains an `index.md` that lists its contents:

```markdown
# Architecture Concepts

| Title | Description | Tags | Status |
|-------|-------------|------|--------|
| [SpacetimeDB Tenant Model](./tenant-model.md) | Multi-tenant data isolation via SpacetimeDB | [backend, spacetime-db] | active |
| [Provider Hierarchy](./provider-hierarchy.md) | LLM provider abstraction layer | [llm, providers] | active |
```

The root `index.md` lists all concept groups with counts:

```markdown
# Project Knowledge Index

> Last updated: 2026-06-29
> OKF Version: 0.1

## Concept Groups

| Group | Count | Description |
|-------|-------|-------------|
| [Architecture](./architecture/index.md) | 5 | How the system is structured |
| [Components](./components/index.md) | 12 | UI components and behavior |
| [Domain](./domain/index.md) | 8 | Business logic and domain knowledge |
| [Decisions](./decisions/index.md) | 3 | Architectural decisions and rationale |
| [Process](./process/index.md) | 4 | How workflows operate |
| [Deprecation](./deprecation/index.md) | 2 | Superseded concepts |
| [State](./state/index.md) | 1 | Current state of play |
| [Inbox](./inbox/index.md) | 3 | Items awaiting curation |
```

## Log File Format

The root `log.md` records knowledge updates in reverse chronological order:

```markdown
# Knowledge Update Log

## 2026-06-29T14:00:00Z - Curation Cycle

- **Added:** `architecture/tenant-model.md` - synthesized from inbox items 2026-06-28, 2026-06-29
- **Updated:** `state/current-state.md` - reflected route geometry QA completion
- **Deprecated:** `deprecation/old-routing-engine.md` - superseded by new geometry pipeline
- **Processed inbox:** 3 items moved to `inbox/processed/`
```

## Curation Rules

1. The curation agent reads all unprocessed inbox items plus existing concept files plus the codebase.
2. **The curation agent fetches and reads GitHub issues referenced by `issue_refs` in inbox item frontmatter** (using `gh issue view`). These issues contain pre-approved directives, acceptance criteria, linked epics, and full reasoning that enriches the curated concepts beyond commit messages alone.
3. For each inbox item, the agent determines which concept(s) to create or update.
4. New concepts get a filename matching the slugified title.
5. Updated concepts get new content merged with existing, preserving prior context.
6. When a concept is superseded, the old file moves to `deprecation/` with `supersedes` pointing to the new file.
7. After curation, processed inbox items move to `inbox/processed/`.
8. The agent updates `log.md` with a summary of all changes.
9. The agent updates all `index.md` files to reflect the current state.

## Legacy Alignment Mode

Projects with existing documentation (e.g. `docs/`, `docs/design/`, `docs/agents/`) do not need to move or restructure their docs. OKF works as a **curated knowledge graph layer** over existing documentation.

### How It Works

1. Existing docs stay where they are. They are not moved into `knowledge/`.
2. OKF concept files in `knowledge/` reference existing docs via the `resource` field.
3. Each concept provides a structured summary, tags, and type classification for the referenced doc.
4. Agents read the OKF index to find relevant concepts, then follow the `resource` link to the full source doc.
5. The OKF bundle acts as a navigable, typed, searchable index over the existing documentation.

### Concept Content for Referenced Docs

A concept that references an existing doc should contain:

- A summary of the doc's key content (not a copy - a synthesis)
- The most important decisions, patterns, or rules from the doc
- Tags that make it discoverable
- The `resource` field pointing to the source doc path (relative to repo root)

Example:
```yaml
---
type: Architecture
title: Conversational Flow Architecture
description: Chat-lane architecture with injectable components
resource: ./docs/design/CONVERSATIONAL-FLOW-ARCHITECTURE.md
tags: [architecture, conversational, ui, chat-lane]
timestamp: 2026-06-29T12:00:00Z
status: active
---
```

### Greenfield vs Legacy

| Aspect | Greenfield (new projects) | Legacy (existing docs) |
|--------|--------------------------|----------------------|
| Knowledge location | All in `knowledge/` | Existing docs stay in place, `knowledge/` references them |
| Content | Full concepts written directly | Summaries with `resource` links to source docs |
| Curation | Creates new concepts from inbox + code | Also scans existing docs and creates reference concepts |
| Agent onboarding | Read `knowledge/` only | Read `knowledge/` index, follow `resource` links to full docs |

### Legacy Scan

When initializing OKF on a legacy project, the install script or curation agent should:

1. Scan `docs/`, `docs/design/`, `docs/agents/`, and any other documentation directories.
2. For each significant doc, create a concept in the appropriate type directory.
3. Set the `resource` field to the doc's path relative to the repo root.
4. Classify each doc by type (Architecture, Component, Domain, Decision, Process, State).
5. Extract tags from the doc's content and filename.
6. Write a synthesis of the doc's key content in the concept body.
7. Skip sprint-specific or transient docs (those are captured by the inbox/curation pipeline instead).

## Agent Onboarding

When an agent starts work on a project with an OKF bundle:

1. Read `knowledge/index.md` for an overview of all concept groups.
2. Read `knowledge/state/index.md` and relevant state files for current status.
3. Read `knowledge/deprecation/index.md` to understand what has been superseded.
4. Read concept files relevant to the work area (identified by tags and titles).
5. After completing work, the commit-time hook captures a session synthesis to `knowledge/inbox/`.

## Versioning

- `log.md` tracks knowledge evolution at the bundle level.
- Git history provides full diff tracking for every concept file.
- The `supersedes` field links deprecated concepts to their replacements.
- The OKF standard version is recorded in the root `index.md`.
