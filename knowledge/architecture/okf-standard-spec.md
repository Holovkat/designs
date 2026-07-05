---
type: Architecture
title: OKF Standard Specification
description: The v0.1 specification defining the Open Knowledge Format convention
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, standard, specification, frontmatter, concepts]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# OKF Standard v0.1

The Open Knowledge Format (OKF) defines a convention for maintaining project knowledge as markdown files with structured frontmatter, stored in git alongside code. It is designed so that AI agents can read project knowledge before starting work and capture session context after completing work.

## Design Principles

1. **Git is canonical.** All knowledge lives in markdown files committed to the project repo. No external system is the source of truth.
2. **Agents read first (OKF-First Protocol).** Before starting work, agents query the OKF bundle to understand current state, architecture, and prior decisions. See [OKF-First Protocol](../decisions/okf-first-protocol.md).
3. **Two-phase capture.** Agents write session syntheses to an inbox before committing. A curation pass later upserts permanent concept files with full context. The post-commit hook refreshes the viewer manifest and nudges for curation.
4. **Progressive disclosure.** Index files at each level provide summaries. Agents read the index, then drill into specific concepts only when relevant.
5. **Deprecation is explicit.** When a concept is superseded, the old file is moved to `deprecation/` with a `supersedes` link, not deleted.

## Directory Structure

Each project repo gets a `knowledge/` directory with subdirectories for each concept type: `inbox/`, `architecture/`, `components/`, `domain/`, `decisions/`, `process/`, `deprecation/`, and `state/`. Each subdirectory has its own `index.md`. The root has `index.md` and `log.md`.

## Concept Types

Eight types map to directories: Architecture, Component, Domain, Decision, Process, Deprecation, State, and Inbox. The `type` field in frontmatter determines which directory a concept belongs to. See [Concept Types](../domain/concept-types.md) for details.

## Frontmatter

All OKF files use YAML frontmatter. The only required field is `type`. Recommended fields include `title`, `description`, `resource`, `tags`, and `timestamp`. Extension fields include `status`, `supersedes`, `issue_refs`, `epic_refs`, `session_id`, `commit_sha`, and `branch`. See [Frontmatter Schema](../domain/frontmatter-schema.md) for the full specification.

## Key Rules

- Never delete concept files. Move superseded ones to `deprecation/` instead.
- Always update `index.md` files when adding, updating, or removing concepts.
- One concept per file. Do not mix topics or types.
- Use lowercase, consistent tags across all concepts.
- The `resource` field should point to the relevant code file, issue, or existing doc.
- For legacy projects, concepts reference existing docs via `resource` rather than duplicating content. See [Legacy Alignment Mode](../decisions/legacy-alignment-mode.md).

## Curation

The curation agent reads all unprocessed inbox items, existing concept files, the codebase, and GitHub issues referenced by `issue_refs`. It creates or updates concept files, moves superseded concepts to `deprecation/`, processes inbox items, and updates all indexes and `log.md`. See [Curation Pass](../process/curation-pass.md).

## Agent Onboarding

1. Read `knowledge/index.md` for an overview of all concept groups.
2. Read `knowledge/state/index.md` for the current state of play.
3. Read `knowledge/deprecation/index.md` to understand what has been superseded.
4. Read concept files relevant to the work area (identified by tags and titles).
5. After completing work, agents write a session synthesis to `knowledge/inbox/` before committing. The post-commit hook refreshes the viewer manifest and nudges for curation.

## Versioning

- `log.md` tracks knowledge evolution at the bundle level.
- Git history provides full diff tracking for every concept file.
- The `supersedes` field links deprecated concepts to their replacements.
- The OKF standard version is recorded in the root `index.md`.
