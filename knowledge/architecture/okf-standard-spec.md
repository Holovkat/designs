---
type: Architecture
title: OKF Standard and Core Profile
description: Git-canonical OKF v0.1 with the warning-first machine-checkable okf-core/1.0 semantic application profile
resource: ./templates/okf/OKF-STANDARD.md
tags: [concepts, frontmatter, okf, semantic-profile, specification, standard]
timestamp: 2026-08-08T00:00:00Z
status: active
issue_refs: [26]
epic_refs: [26]
assertion_state: proposed
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-contract
evidence_refs: [templates/okf/OKF-STANDARD.md, templates/okf/schema/okf-core-1.0.schema.json]
---

# Canonical representation

OKF remains repository-local Markdown with YAML frontmatter under Git. The v0.1
directory/type convention, indexes, log, progressive disclosure, explicit
deprecation, OKF-first consumption, and two-tier capture remain the authoring
model. An external graph, RDF store, JSON-LD processor, SHACL engine, remote
context, or network service is not required.

# Core 1.0 profile

`okf-core/1.0` adds a versioned schema and shared parser/linter semantics for new
or materially updated records. It requires descriptive metadata, controlled
type/lifecycle/tags/timestamps, conditional Inbox/Deprecation/provenance fields,
stable project-local IDs for typed edges, and controlled predicates
`depends_on`, `implements`, `supersedes`, `derived_from`, `contradicts`, and
`blocked_by`.

Assertion state (`verified`, `inferred`, `proposed`, `historical`, `stale`) is
separate from lifecycle and governance. Flat provenance/evidence fields record
generation, authority, verification, validity, and staleness. Paths remain
navigation/context rather than semantic identity or proof.

# Compatibility and validation

Retained history is audited in warning/legacy mode and never normalized merely
to silence findings. `strict-new` applies to new/updated records through author,
capture, and curator staging gates; `strict-bundle` requires a reviewed
migration manifest and rollback proof. Unknown fields are preserved and new
portable extensions use `x_<owner>_<name>`.

Unresolved/invalid relationships, legacy path-valued `supersedes`, assertion
states, and malformed profile records remain distinguishable. `A supersedes B`
means A replaces B; the old record stays in `deprecation/` and consumers derive
`superseded_by`.

# Operations

Capture quality is compact/reference-first for unsafe raw or oversized content.
Curation and archive are explicit-root, locked, quota-bounded, validated,
cancellable, observable, resumable, and recoverable. The approved cadence is
manual status/triage plus a separately requested batch; thresholds and warnings
never create execution authority.

# Related concepts

- [OKF Semantic Profile and Semantic-Web Scope](../decisions/semantic-profile-and-semantic-web-scope.md)
- [OKF Bounded Curation Pass](../process/curation-pass.md)
- [Post-Commit Tier 1 Capture System](./hook-system.md)
