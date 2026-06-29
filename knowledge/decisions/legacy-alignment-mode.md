---
type: Decision
title: Legacy Alignment Mode
description: Keep existing docs in place rather than migrating content into OKF; concepts reference docs via resource field
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, legacy, docs, alignment, migration]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Decision: Legacy Alignment Mode

## Context

Many projects have substantial existing documentation in `docs/`, `docs/design/`, `docs/agents/`, and other directories. When deploying OKF, a decision must be made: should existing docs be migrated into `knowledge/`, or should they remain in place?

## Decision

Existing documentation stays where it is. OKF works as a curated knowledge graph layer over existing documentation. OKF concept files in `knowledge/` reference existing docs via the `resource` field.

## How It Works

1. Existing docs stay where they are. They are not moved into `knowledge/`.
2. OKF concept files in `knowledge/` reference existing docs via the `resource` field.
3. Each concept provides a structured summary, tags, and type classification for the referenced doc.
4. Agents read the OKF index to find relevant concepts, then follow the `resource` link to the full source doc.
5. The OKF bundle acts as a navigable, typed, searchable index over the existing documentation.

## Rationale

- **Avoids duplication:** Moving docs into `knowledge/` would create two copies of the same content, requiring synchronisation.
- **Preserves existing content:** Detailed docs often contain formatting, diagrams, and depth that would be lost in a migration.
- **Provides typed searchable index:** OKF concepts add structure (type, tags, description) that makes existing docs discoverable by agents.
- **Non-destructive:** The deployment can be done without touching existing docs, reducing risk.
- **Progressive migration:** Teams can gradually create OKF concepts for new knowledge while referencing existing docs for old knowledge.

## Concept Content for Referenced Docs

A concept that references an existing doc should contain:
- A summary of the doc's key content (not a copy, a synthesis)
- The most important decisions, patterns, or rules from the doc
- Tags that make it discoverable
- The `resource` field pointing to the source doc path (relative to repo root)

## Greenfield vs Legacy

| Aspect | Greenfield (new projects) | Legacy (existing docs) |
|--------|--------------------------|----------------------|
| Knowledge location | All in `knowledge/` | Existing docs stay in place, `knowledge/` references them |
| Content | Full concepts written directly | Summaries with `resource` links to source docs |
| Curation | Creates new concepts from inbox + code | Also scans existing docs and creates reference concepts |
| Agent onboarding | Read `knowledge/` only | Read `knowledge/` index, follow `resource` links to full docs |

## Legacy Scan

When initializing OKF on a legacy project, the install script detects `docs/` and advises running a legacy scan. The curation agent or `/okf-curate` command scans `docs/`, `docs/design/`, `docs/agents/`, and other documentation directories, creating a concept for each significant doc with the `resource` field pointing to the source. See [Seed From Existing Docs](../process/seed-from-existing-docs.md).

## Conflict Resolution

When docs and OKF disagree, OKF is current. OKF concepts are the agent-facing entry points; they are curated and maintained. The `docs/` files are detailed references that may be outdated. If a conflict is found, the OKF concept should be updated to reflect the current state, and the source doc should be flagged for review.

## Alternatives Considered

- **Full migration:** Move all docs into `knowledge/`. Rejected because of duplication risk and the loss of formatting/depth in existing docs.
- **Ignore existing docs:** Create OKF concepts only from code and sessions. Rejected because it wastes existing knowledge and forces agents to rediscover documented decisions.
- **Centralised knowledge store:** Maintain a separate knowledge repository. Rejected in favour of [per-project bundles](./per-project-bundles.md).
