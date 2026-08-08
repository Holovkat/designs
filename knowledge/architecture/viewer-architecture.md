---
type: Architecture
title: OKF Typed Viewer Architecture
description: Browse and graph viewer with stable semantic IDs, typed/inverse edges, Markdown citations, and visible relationship diagnostics
resource: ./templates/okf/viewer.html
tags: [graph, okf, relationships, semantics, viewer]
timestamp: 2026-08-08T00:00:00Z
status: active
issue_refs: [26]
epic_refs: [26]
assertion_state: proposed
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-source
evidence_refs: [templates/okf/viewer.html, templates/okf/tests/viewer-relationships_test.mjs]
---

# Identity and parsing

The single-file viewer keeps filesystem paths for navigation and stable
`okf-<uuidv4>` frontmatter IDs for semantic identity. Embedded generation uses
the shared pinned C7 parser. Direct browser loading retains an explicit legacy
fallback rather than inventing different strict YAML semantics.

# Graph model

All six stored predicates—`depends_on`, `implements`, `supersedes`,
`derived_from`, `contradicts`, and `blocked_by`—render with distinct labels and
styles. The viewer derives inspectable inverse edges, deduplicates symmetric
`contradicts`, and keeps untyped Markdown citations/backlinks separate.

Unresolved or malformed targets, duplicate IDs, self edges, forbidden cycles,
allowed `blocked_by` deadlocks, redundant symmetric edges, and legacy path-valued
relationships remain visible diagnostics. The viewer never fetches, fabricates,
drops, or silently rewrites a target.

# Navigation

Relative Markdown links resolve from the source file path. Repository-root
relative `resource` paths resolve from the knowledge bundle's project root.
Typed edges continue to resolve by stable ID across a file rename or move.

# Loading and rendering

Embedded `viz.html`, folder picker, and drag/drop modes feed the same concept
model. Browse, search/filter, Markdown, Mermaid, metadata, typed relationships,
citations, backlinks, and diagnostics remain inspectable without changing the
source bundle.

# Related concepts

- [Viz Generator Design](./viz-generator-design.md)
- [Semantic Identifiers and Relationships](../decisions/semantic-profile-and-semantic-web-scope.md)
- [Link Resolution](../domain/link-resolution.md)
