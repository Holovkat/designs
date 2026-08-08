---
type: Domain
title: Link and Relationship Resolution in OKF
description: Separation of stable semantic identifiers, typed relationships, Markdown citations, and resource navigation
resource: ./templates/okf/viewer.html
tags: [citations, identifiers, links, navigation, okf, relationships, viewer]
timestamp: 2026-08-08T00:00:00Z
status: active
id: okf-26000000-0000-4000-8000-000000000004
assertion_state: verified
generated_at: 2026-08-08T00:00:00Z
generated_by: codex-epic-26
source_authority: repository-git
evidence_refs: [templates/okf/viewer.html, templates/okf/generate-viz.js]
verified_at: 2026-08-08T00:00:00Z
verification_method: viewer-and-generator-review
validity_basis: Current OKF viewer navigation and relationship model
---

# Link and Relationship Resolution in OKF

OKF deliberately keeps three mechanisms separate:

1. stable `id` values identify concepts across renames and file moves;
2. typed frontmatter predicates assert semantic relationships by stable ID; and
3. ordinary Markdown links provide citations and human navigation by path.

File paths remain repository locations, not semantic identities.

## Typed Relationship Resolution

The generator parses accepted YAML with the pinned local runtime and builds an
ID map. It resolves `depends_on`, `implements`, `supersedes`, `derived_from`,
`contradicts`, and `blocked_by` values against that map. The viewer renders each
predicate and its inverse distinctly. Symmetric contradiction edges are
deduplicated.

Missing targets, invalid target values, duplicate IDs, self-edges, cycles, and
legacy path-shaped values remain visible diagnostics. They are never silently
dropped or converted into assertions.

## Markdown Citations and Backlinks

Concept bodies use normal relative Markdown links with `.md` extensions. The
viewer resolves them relative to the source file, normalises `.` and `..`
segments within the knowledge bundle, and navigates to the matching concept
file. It separately computes a `Cited by` backlink list. These citations remain
usable in ordinary Markdown and do not require the target to expose a stable ID.

## Resource Navigation

The optional `resource` field may be a repository-root-relative file, issue, or
external URI. Root-relative resources are resolved from the project root, not
from the concept directory. Resource links do not become graph relationships.

## Compatibility

Legacy concepts without stable IDs remain browsable through an explicit
fallback identity derived from their file location. The viewer marks that mode;
new strict concepts use stable IDs. This preserves gradual adoption without
making legacy path identity the semantic contract.

See [Viewer Architecture](../architecture/viewer-architecture.md) and
[OKF Semantic Query Helper](../architecture/okf-query-helper.md).
