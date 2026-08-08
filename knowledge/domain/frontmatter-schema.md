---
type: Domain
title: OKF Frontmatter Schema
description: OKF Core 1.0 fields, conditional requirements, semantic relationships, provenance, and compatibility modes
resource: ./templates/okf/schema/okf-core-1.0.schema.json
tags: [compatibility, frontmatter, metadata, okf, schema, yaml]
timestamp: 2026-08-08T00:00:00Z
status: active
id: okf-26000000-0000-4000-8000-000000000002
assertion_state: verified
generated_at: 2026-08-08T00:00:00Z
generated_by: codex-epic-26
source_authority: repository-git
evidence_refs: [templates/okf/schema/okf-core-1.0.schema.json, templates/okf/OKF-STANDARD.md]
verified_at: 2026-08-08T00:00:00Z
verification_method: schema-and-specification-review
validity_basis: Current OKF Core 1.0 application profile
---

# OKF Frontmatter Schema

OKF Markdown remains canonical. YAML frontmatter supplies the machine-checkable
metadata used by the shared parser, linter, curator, viewer, and semantic query
helper. The versioned JSON Schema is distributed locally; runtime validation
does not require a network service or package download.

## Core Record

Strict durable concepts require:

- one controlled `type` matching the containing concept directory;
- non-empty `title` and `description`;
- unique lowercase `tags`;
- an RFC 3339 UTC `timestamp` and controlled lifecycle `status`; and
- a stable project-local `id` in the `okf-<uuid-v4>` form.

Concepts created by the curator additionally require non-empty `generated_at`
and `generated_by`. Inbox records have tier-specific capture/provenance fields
instead of a durable concept ID.

## Typed Relationships

The six local predicates are `depends_on`, `implements`, `supersedes`,
`derived_from`, `contradicts`, and `blocked_by`. Values are unique stable IDs,
never file paths. Empty arrays are valid. A replacement record points
`supersedes` from the new concept to the older retained concept; a deprecation
record is not required to reverse that edge.

Markdown links remain citations and navigation. They do not silently become
typed assertions.

## Assertion and Evidence Fields

`assertion_state` distinguishes `verified`, `inferred`, `proposed`,
`historical`, and `stale` knowledge. Evidence-bearing records can state
`source_authority`, immutable `evidence_refs`, `verified_at`,
`verification_method`, and `validity_basis`. `generated_at` and `generated_by`
identify generated provenance; they do not by themselves make an assertion
verified.

## Type-Specific Rules

- Decisions include rationale, alternatives, and consequences.
- Deprecations include exactly one each of `# What Was the Issue`,
  `# Why It Was Deprecated`, `# Lessons Learned`,
  `# When This Might Be Relevant Again`, and `# What to Watch Out For` in that
  order.
- Tier 1 and Tier 2 Inbox records use their exact body contracts and full Git
  identifiers.
- Directory/type alignment and relationship target resolution are validated by
  the repository linter because they require bundle context.

## Extensions and Compatibility

Project extensions use `x_`-prefixed fields unless registered by the profile.
Unknown unprefixed fields are diagnostics. Validation has three retained
outcomes: strict, legacy-compatible warning, and retained nonconformant. Warning
mode audits existing bundles before opt-in enforcement; it does not rewrite or
discard historical records.

The canonical details live in [OKF Standard](../../templates/okf/OKF-STANDARD.md)
and the [OKF Core 1.0 schema](../../templates/okf/schema/okf-core-1.0.schema.json).
