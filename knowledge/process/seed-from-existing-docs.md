---
type: Process
title: Seed Knowledge From Existing Docs
description: How to create OKF concepts from a project's existing documentation
resource: ./templates/okf/DEPLOYMENT-RUNBOOK.md
tags: [okf, seeding, docs, legacy, concepts]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Seed Knowledge From Existing Docs

Phase 2 of the OKF deployment workflow. This is the most important phase because it establishes the knowledge baseline. The agent reads the project's existing documentation and creates OKF concepts for each significant topic.

## Source Material Priority

Read in this order:

1. `AGENTS.md` (root) - extract architecture decisions, agent definitions, conventions, deployment gates, key patterns.
2. `docs/` - read all markdown files, extracting design decisions, architecture patterns, runbooks.
3. `docs/design/` - architecture docs, reference docs, pattern docs.
4. `docs/agents/` - agent knowledge spaces, specialist curation.
5. `README.md` - project overview, setup commands.
6. Any `src/AGENTS.md` or sub-directory `AGENTS.md` files.

## Concept Creation Rules

- One concept per file. Do not mix topics.
- Use the correct concept type for each file. See [Concept Types](../domain/concept-types.md).
- Every concept must have YAML frontmatter with at minimum: `type`, `title`, `description`, `tags`, `timestamp`, `status`.
- The `resource` field should point to the source doc or code file that the concept summarises. Use relative paths from the project root (e.g., `./docs/design/ARCHITECTURE.md`).
- Do NOT duplicate the full content of existing docs into concepts. The concept is a typed, searchable summary. The `resource` field links to the full doc.
- For docs that describe multiple topics, create separate concepts for each significant topic.
- Use consistent, lowercase tags across all concepts.

## Concept Type Assignment

| Source material | Concept type | Directory |
|----------------|-------------|-----------|
| System architecture, data models, infrastructure | Architecture | `architecture/` |
| UI components, interaction patterns, HUD layouts | Component | `components/` |
| Business logic, domain entities, workflows | Domain | `domain/` |
| Architectural decisions, rationale, trade-offs | Decision | `decisions/` |
| Workflows, sprint flow, deployment gates, runbooks, agent definitions | Process | `process/` |
| Superseded patterns, removed features | Deprecation | `deprecation/` |
| Current state of play | State | `state/` |

## Volume Guidance

- Expect 40-80 concepts for a mature project with substantial docs.
- Do not create trivial concepts (e.g., "project uses TypeScript"). Focus on knowledge that helps an agent understand the system, make decisions, and avoid mistakes.
- Every concept should answer: "What would an agent need to know about this topic to work effectively?"

## Legacy Alignment

For projects with existing docs, concepts reference the source doc via the `resource` field rather than duplicating content. The concept provides a structured summary, tags, and type classification. The source doc provides the full content. See [Legacy Alignment Mode](../decisions/legacy-alignment-mode.md).

A concept that references an existing doc should contain:
- A summary of the doc's key content (not a copy, a synthesis)
- The most important decisions, patterns, or rules from the doc
- Tags that make it discoverable
- The `resource` field pointing to the source doc path

## After Seeding

Update all `index.md` files with the new concepts and accurate counts. See [Index Structure](../domain/index-structure.md). Update `knowledge/log.md` with a seeding entry.

## Relationship to Other Phases

This phase feeds into [Process GitHub Epics](./process-github-epics.md) (Phase 3), [Create Schema Diagrams](./create-schema-diagrams.md) (Phase 4), and [Curation Pass](./curation-pass.md) (Phase 6). The seeded concepts form the baseline that later phases enrich and the curation pass aligns.
