---
type: Domain
title: Link and Relationship Resolution in OKF
description: Stable identity across fix-on-touch moves, directed typed relationships, citations, resources, and integrity projection
resource: ./templates/okf/viewer.html
tags: [citations, fix-on-touch, identifiers, integrity, links, navigation, okf, relationships, viewer]
timestamp: 2026-08-09T11:22:20Z
status: active
id: okf-26000000-0000-4000-8000-000000000004
assertion_state: inferred
generated_at: 2026-08-09T11:22:20Z
generated_by: codex-epic-37-concept-42
generation_method: author-time-agent
source_authority: repository-source
evidence_refs: [templates/okf/viewer.html, templates/okf/viewer-assets/okf-viewer.js, templates/okf/generate-viz.js, templates/okf/tests/viewer-relationships_test.mjs]
---

# Link and Relationship Resolution in OKF

OKF deliberately keeps three mechanisms separate:

1. stable `id` values identify concepts across renames and file moves;
2. typed frontmatter predicates assert semantic relationships by stable ID; and
3. ordinary Markdown links provide citations and human navigation by path.

File paths remain repository locations, not semantic identities. New and
materially updated permanent concepts require stable identity; untouched legacy
path fallback remains compatibility-only.

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

Untouched legacy concepts without stable IDs remain browsable through an
explicit fallback identity derived from their file location. The viewer marks
that mode; a fix-on-touch edit, rename, or deprecation must assign a stable ID,
and any valid prior ID must remain unchanged. Lifecycle, assertion state,
generation mechanism, authority, verifier, and evidence are projected as
separate metadata rather than inferred from the path or body. This preserves
gradual adoption without making legacy path identity the semantic contract.

See [Viewer Architecture](../architecture/viewer-architecture.md) and
[OKF Semantic Query Helper](../architecture/okf-query-helper.md).
