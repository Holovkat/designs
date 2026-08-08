---
type: Architecture
title: Viz Generator Design
description: Deterministic repository-local generator that parses concepts with the pinned runtime and embeds their semantic model in viz.html
resource: ./templates/okf/generate-viz.js
tags: [generator, nodejs, okf, semantics, viewer, viz]
timestamp: 2026-08-08T00:00:00Z
status: active
issue_refs: [26]
epic_refs: [26]
assertion_state: proposed
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-source
evidence_refs: [templates/okf/generate-viz.js, templates/okf/tests/viewer-relationships_test.mjs]
---

# Generation

`node knowledge/generate-viz.js knowledge/` reads regular Markdown concepts
inside the named knowledge directory, excludes structural/generated files, and
uses the pinned C7 YAML parser to build deterministic path, frontmatter, body,
identity, and diagnostic records. It injects JSON-safe data into `viewer.html`
and writes a self-contained `viz.html`.

Stable semantic IDs remain separate from filepaths. The generated model retains
all six relationship predicates, legacy values, Markdown citations, and parse
diagnostics so the viewer can show unresolved/invalid edges instead of losing
them. When the local parser is deliberately unavailable, the documented legacy
fallback remains read-only and visible.

Generation is an explicit repository-local command, not a post-commit or
parent-workspace side effect. It does not scan sibling repositories, start
curation, or supply verification/rollout authority.

# Related concepts

- [OKF Typed Viewer Architecture](./viewer-architecture.md)
- [Post-Commit Tier 1 Capture System](./hook-system.md)
