---
type: Domain
title: OKF Frontmatter Schema
description: Strict fix-on-touch identity, lifecycle/assertion, generation, evidence, relationship, and compatibility fields
resource: ./templates/okf/schema/okf-core-1.0.schema.json
tags: [compatibility, fix-on-touch, frontmatter, integrity, metadata, okf, schema, yaml]
timestamp: 2026-08-09T11:22:20Z
status: active
id: okf-26000000-0000-4000-8000-000000000002
assertion_state: inferred
generated_at: 2026-08-09T11:22:20Z
generated_by: codex-epic-37-concept-42
generation_method: author-time-agent
source_authority: repository-contract
evidence_refs: [templates/okf/schema/okf-core-1.0.schema.json, templates/okf/schema/okf-core-1.0.validator.mjs, templates/okf/tests/linter_test.mjs, templates/okf/OKF-STANDARD.md]
---

# OKF Frontmatter Schema

OKF Markdown remains canonical. YAML frontmatter supplies the machine-checkable
metadata used by the shared parser, linter, curator, viewer, and semantic query
helper. The versioned JSON Schema is distributed locally; runtime validation
does not require a network service or package download.

## Core Record

New or materially updated durable concepts require:

- one controlled `type` matching the containing concept directory;
- a stable project-local `id` in the `okf-<uuid-v4>` form;
- non-empty `title` and `description`, unique lowercase `tags`, and an RFC 3339
  UTC `timestamp`;
- separate controlled lifecycle `status` and claim `assertion_state`;
- `generated_at`, named `generated_by`, and controlled `generation_method`; and
- claim-scoped `source_authority` plus non-empty `evidence_refs`.

Material means a direct permanent concept add, body/frontmatter edit, rename, or
move. Strict-new can bind those paths to one explicit Git baseline. Untouched
legacy remains warning-only. A valid prior ID cannot change, while touched
legacy without an ID receives one without automatic path, index, citation, or
history rewrites. Curator output additionally requires
`generation_method: curator`. Inbox records keep their tier-specific
capture/provenance fields instead of a durable concept ID.

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
`historical`, and `stale` knowledge. The top-level authority and evidence
references support the concept's single record-level claim, so frontmatter does
not repeat its prose. `generated_at`, `generated_by`, and `generation_method`
record creation/update provenance; they do not make an assertion verified.

`verified` additionally requires `verified_at`, an independent `verified_by`
producer distinct from `generated_by`, `verification_method`, and
`validity_basis`. A contextual `resource` cannot be the only verification
evidence. Unsupported self-attestation fails strict validation; routine authored
knowledge remains proposed or inferred.

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

The baseline-aware linter also rejects permanent deletion, valid-ID changes,
and a deprecation transition without an active replacement → old `supersedes`
edge. The canonical details live in [OKF Standard](../../templates/okf/OKF-STANDARD.md)
and the [OKF Core 1.0 schema](../../templates/okf/schema/okf-core-1.0.schema.json).
