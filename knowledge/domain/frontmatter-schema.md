---
type: Domain
title: OKF Frontmatter Schema
description: Required and optional YAML frontmatter fields for OKF concept files
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, frontmatter, yaml, schema, metadata]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# OKF Frontmatter Schema

All OKF files use YAML frontmatter delimited by `---`. The frontmatter provides metadata for indexing, search, and provenance.

## Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `type` | string | One of the eight concept types (Architecture, Component, Domain, Decision, Process, Deprecation, State, Inbox). Determines which directory the concept belongs to. |

## Recommended Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Human-readable title for index listings and the viewer |
| `description` | string | One-line summary for index listings and search |
| `resource` | string | URI to the related code file, issue, or external resource. Relative path from repo root (e.g., `./src/db/schema.ts`) |
| `tags` | array | Lowercase strings for search and filtering (e.g., `[backend, spacetime-db]`) |
| `timestamp` | string | ISO 8601 datetime of creation or last update (e.g., `2026-06-29T10:00:00Z`) |

## Extension Fields

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | Lifecycle state: `active`, `deprecated`, `in-progress`, `blocked` |
| `supersedes` | array | Filenames of concepts this one replaces (used in `deprecation/` entries) |
| `issue_refs` | array | GitHub/GitLab issue numbers for traceability (e.g., `[1503]`) |
| `epic_refs` | array | Epic issue numbers (e.g., `[1495]`) |
| `session_id` | string | UUID of the session that produced this knowledge (used in inbox items) |
| `commit_sha` | string | Git commit SHA that triggered the capture (used in inbox items) |
| `branch` | string | Branch context (used in inbox items) |

## How Each Field Is Used

### type
The viewer uses this to colour-code nodes and badges. The Pi extension uses it to categorise search results. The curation agent uses it to determine which directory to place the concept in.

### title
Displayed in the viewer's folder tree, graph node labels, and index tables. Used by the Pi extension's `/okf-query` command in search results.

### description
Shown in index tables and search results. Used for quick scanning without opening the full concept.

### resource
Rendered as a clickable link in the viewer's frontmatter section. Points to the source code, doc, or issue that the concept summarises. For legacy projects, this links to the existing doc that the concept references. See [Legacy Alignment Mode](../decisions/legacy-alignment-mode.md).

### tags
Used by the viewer's search filter and the Pi extension's `/okf-query` command. Should be lowercase and consistent across concepts.

### timestamp
Used for chronological sorting and log entries. ISO 8601 format ensures parseability.

### status
Controls visual indicators in the viewer: deprecated concepts show a circle marker in the tree and dashed borders in the graph. The curation agent updates status when concepts are superseded.

### supersedes
Creates a link from a deprecation entry to its replacement. Used for audit trails.

### issue_refs / epic_refs
The curation agent fetches these GitHub issues via `gh issue view` to enrich concept content with full context (directives, acceptance criteria, reasoning). The Pi extension's `/okf-curate` command lists these for the curation prompt.

### session_id / commit_sha / branch
Provenance fields primarily used in inbox items written by the post-commit hook. They link the inbox item back to the specific commit and session that produced it.

## Example

```yaml
---
type: Architecture
title: SpacetimeDB Tenant Model
description: Multi-tenant data isolation via SpacetimeDB
resource: ./src/db/schema.ts
tags: [backend, spacetime-db]
timestamp: 2026-06-29T10:00:00Z
status: active
issue_refs: [1503]
---
```
