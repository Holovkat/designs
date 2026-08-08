---
type: Architecture
title: OKF Query Helper
description: Portable grep fallback plus pinned local semantic queries for typed relationships, assertions, evidence, lifecycle, and validation state
resource: ./templates/okf/okf-query.sh
tags: [evidence, lifecycle, okf, query, relationships, search]
timestamp: 2026-08-08T00:00:00Z
status: active
issue_refs: [26]
epic_refs: [26]
assertion_state: proposed
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-source
evidence_refs: [templates/okf/okf-query.sh, templates/okf/bin/okf-query.mjs, templates/okf/tests/query_test.mjs]
---

# Portable path

`knowledge/okf-query.sh <terms>` and `--decisions` use only shell search tools,
rank frontmatter before body matches, and remain available without `.okf` or a
Node parser. This is the minimum OKF-first discovery path.

# Semantic path

Installed `.okf/bin/okf-query.mjs` requires one explicit physical Git root and
the pinned C7 parser. It supports predicate/target and related-to queries,
assertion state, evidence presence/reference, lifecycle/status, and validation
status (`strict`, `legacy-compatible`, or retained nonconformant), with
deterministic text or JSON.

The query surface distinguishes stored predicates, derived inverse matches,
Markdown citations, unresolved targets, lifecycle, assertion, and validation.
It reads only contained regular files, rejects escaping symlinks, uses no
network, and never mutates, validates into compliance, starts curation, or
turns a result into execution authority.

If the local semantic runtime is missing, semantic filters fail closed with
guidance while basic/decision search continues through the portable path.

# Related concepts

- [OKF-First Protocol](../decisions/okf-first-protocol.md)
- [OKF Typed Viewer Architecture](./viewer-architecture.md)
- [OKF Semantic Profile](../decisions/semantic-profile-and-semantic-web-scope.md)
