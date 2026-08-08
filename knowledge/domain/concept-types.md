---
type: Domain
title: OKF Concept Types
description: Eight OKF record types, their directories, and their strict lifecycle responsibilities
resource: ./templates/okf/OKF-STANDARD.md
tags: [concepts, okf, taxonomy, types]
timestamp: 2026-08-08T00:00:00Z
status: active
id: okf-26000000-0000-4000-8000-000000000003
assertion_state: verified
generated_at: 2026-08-08T00:00:00Z
generated_by: codex-epic-26
source_authority: repository-git
evidence_refs: [templates/okf/OKF-STANDARD.md]
verified_at: 2026-08-08T00:00:00Z
verification_method: specification-review
validity_basis: Current OKF Core 1.0 type contract
---

# OKF Concept Types

OKF defines eight record types. Each permanent concept has one stable purpose
and lives in the matching directory.

| Type | Directory | Use |
|---|---|---|
| `Architecture` | `architecture/` | System structure, data models, infrastructure, and technical boundaries |
| `Component` | `components/` | User-facing components and interaction behaviour |
| `Domain` | `domain/` | Business entities, rules, vocabulary, and domain workflows |
| `Decision` | `decisions/` | A choice, rationale, alternatives, and consequences |
| `Process` | `process/` | Human or agent workflows, runbooks, gates, and operating procedures |
| `Deprecation` | `deprecation/` | Retained history for a superseded concept or approach, including replacement and lessons |
| `State` | `state/` | A dated current-state snapshot and its evidence boundary |
| `Inbox` | `inbox/` | Tier 1 commit captures and Tier 2 session syntheses awaiting bounded curation |

## Selection Rules

- Prefer Decision when the durable value is why a choice was made; prefer
  Architecture when it is the resulting structure.
- Prefer Domain for problem-space rules and Process for how people or agents
  perform work.
- Prefer Component for visible interaction behaviour and Architecture for the
  supporting system boundary.
- State records are evidence-backed snapshots and should be refreshed or
  superseded when facts change.
- Never delete a superseded permanent concept. Retain it as Deprecation and
  point `supersedes` from the new replacement's stable ID to the older ID.

## Inbox Is Staging, Not a Permanent Concept Type

Tier 1 records are written after ordinary commits by the non-blocking local
hook. Tier 2 records are written after committed work at session close. They
have different exact body contracts and are complementary. A successful,
validated bounded run moves selected sources to `inbox/processed/`; an archive
remains manifest-backed and reversible.

See [OKF Inbox Format](./inbox-format.md) and
[OKF Frontmatter Schema](./frontmatter-schema.md).
