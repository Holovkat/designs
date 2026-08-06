---
type: Decision
title: Inbox Quality and Retention Policy
description: Operator-approved warning-first, non-destructive quality, deduplication, retention, and archive rules for OKF inbox items
resource: https://github.com/Holovkat/designs/issues/26
tags: [okf, inbox, quality, retention, deduplication, provenance]
timestamp: 2026-08-06T03:19:40Z
status: active
issue_refs: [26]
epic_refs: [26]
decision_status: operator-approved-2026-08-06
---

# Decision Status and Scope

The operator approved this Epic #26 A4 policy on 2026-08-06. It is
warning-first and non-destructive: it authorizes no capture rejection, automatic
cleanup, archive, delete, curation run, scheduler, cross-project rollout, or
`AGENTS.md` change. It converts A1–A3 evidence into requirements for later
validation, triage, and operator-reviewed archive work.

# Verified Evidence Used

- The A2 designs baseline measured 8 unprocessed and 2 processed inbox items,
  10,937 B pending, 18,041 B retained, and a 3,918 B maximum retained item.
  It found no malformed frontmatter, invalid `Inbox` types, required-body gaps,
  exact-content duplicates, title duplicates, or inbox-index drift.
- A2 found two legacy unprocessed records without `capture_tier`, five current
  Tier 1 records with repeated `okf` tags, two pre-#30 filenames without the
  ISO `T` separator, and one cross-repository short SHA (`ecb76f8`) that cannot
  resolve in the designs object database. These are provenance-quality facts,
  not deletion or rewrite authority.
- A1 found external backlog/index drift and identified a P0 canonical hook
  isolation failure. The designs-only remediation `20acf25` removed the
  parent-workspace call and its fixture proves no parent generator is invoked.
  External observations remain audit evidence only; this policy does not
  authorize work in those repositories.
- A3 requires bounded, fail-closed execution and rejects unbounded scheduling,
  broad traversal, irreversible recovery, and automatic retries.

# Proposed Policy

## 1. Signal and Size

Inbox items must be concise knowledge captures, not storage for raw operational
artifacts. A capture must summarize the decision or impact and point to the
canonical Git object, issue, log, build artifact, or external evidence instead
of copying it.

The initial `max_inbox_item_bytes` is **16 KiB**. This is a warning-and-review
boundary, not a hook rejection: an item above it remains in place, is marked
`oversized` by future triage, and requires an explicit human decision before
any rewrite, archive, or deletion. It is based on the 3,918 B A2 maximum and
remains warning-only until a separately approved enforcement migration.

Prohibited content includes raw logs, stack-trace dumps, full API/database
payloads, binary encodings, credentials, private keys, token values, bulk
source copies, and unbounded transcripts. A future capture check must warn
without exposing such content in its own report; security-sensitive material
follows repository incident handling rather than normal inbox curation.

## 2. Deduplication and Complementary Provenance

Deduplication is classification before mutation. It must preserve every source
item until an operator approves a reversible archive action.

| Record | Proposed primary key | Expected overlap / exemption | Review outcome |
|---|---|---|---|
| Tier 1 commit capture | Full `commit_sha` | A Tier 2 item may reference the same ordinary SHA; this is complementary provenance, not a duplicate. | Two active Tier 1 items for one full SHA are a duplicate candidate. |
| Tier 2 session synthesis | `session_id` | Its SHA list overlaps the session's Tier 1 records by design. | A second active Tier 2 item for one non-empty session ID is a duplicate candidate. |
| Legacy item | Content SHA-256 plus normalized title/timestamp when available | Missing `capture_tier` or session ID alone is historical lineage. | Flag `needs-human-review`; do not infer a duplicate from missing fields. |
| Any item | Full-content SHA-256 | Identical raw content may still require provenance review. | Flag an exact-content duplicate candidate; retain both until archive approval. |

Filename similarity, repeated title text, branch name, issue reference, or a
short SHA alone is insufficient to remove or merge an item. A historical
noncanonical filename is reported but never renamed by automated tooling.

## 3. Structural and Provenance Quality

Future validation and triage must classify, not silently correct:

- malformed YAML, non-`Inbox` type, missing applicable required fields, or
  missing Tier 1/Tier 2 body sections → `malformed` with exact diagnostics;
- subject-only Tier 1 rationale/impact markers → `low-signal`, retained for
  human review rather than discarded;
- legacy records without `capture_tier` → `legacy-unspecified`, valid history
  unless another structural error exists;
- timestamps conflicting with Git history or outside the accepted format →
  `provenance-ambiguous`, not overwritten;
- SHA unavailable in the local repository but plausibly belonging to a named
  external repository → `provenance-unresolved`, with source authority noted;
- repeated values in a tags array or a noncanonical filename → `quality-warning`.

The A2 repeated `okf` tags are a current quality-warning fixture. A future hook
or linter may prevent new duplicate tags only after warning-mode evidence and
approval; it must not rewrite historical captures.

## 4. Age, Load, and Reporting

A status report must show pending count, pending bytes, largest item, oldest
item age, capture-tier distribution, quality classifications, and duplicate
candidates. It must not start curation.

The following are **review signals only**, not execution triggers:

- oldest pending item at or above 30 days;
- pending load at or above 10 items and/or 16 KiB; and
- any malformed, oversized, exact-content-duplicate, duplicated-session, or
  unresolved-provenance classification.

Count is deliberately not a standalone quality or cadence signal: A2's eight
items represent one six-record Tier 1/Tier 2 group plus two older legacy
syntheses. An operator decides whether status evidence warrants a bounded,
repository-scoped curation request under the separate A5 cadence decision.

## 5. Retention, Archive, and Deletion

Unprocessed inbox files remain authoritative source material until curation or
an explicitly approved archive action. Processed items remain in
`knowledge/inbox/processed/` as an audit trail. No age, size, duplicate, or
quality classification deletes a file.

The future D2 archive workflow must require an operator-reviewed manifest with:

- selected source paths, content hashes, frontmatter identity, classification,
  and deterministic selection rule;
- operator identity/approval, reason, timestamp, repository root, Git revision,
  and destination paths;
- all created/updated archive or replacement paths and their hashes;
- rollback steps and a tested rollback result; and
- a statement that no permanent deletion occurred.

Permanent deletion is outside normal curation and requires a separate explicit
operator approval that identifies every path and manifest, confirms rollback is
no longer required, and is recorded in Git. No automated or batch policy can
supply that approval.

# Parameters for Future Implementation Packets

The gate approved 16 KiB as the initial warning value and the 30-day and
count/bytes review signals. Before C/D implementation packets, define the
source-authority treatment for external SHAs; exact archive-manifest location
and retention duration; security handling for captured sensitive material;
warning-to-enforcement migration criteria; and A3-aligned per-run ceilings,
lock/checkpoint locations, and kill-switch mechanism. None is inferred by this
policy.

# Rejected Paths

- **Automatic threshold curation:** rejected; signals inform an operator only.
- **Automatic duplicate deletion or compaction:** rejected; source material and
  provenance remain recoverable until an approved manifest operation.
- **Renaming or normalizing historical captures in place:** rejected; it changes
  lineage without improving the underlying evidence.
- **Treating every legacy field gap as malformed:** rejected; the two-tier
  format must be warning-first for pre-adoption history.
- **Using a local Git object database as sole external-SHA authority:** rejected;
  cross-repository provenance must be classified, not erased.

# Implementation Boundary

C1/C2 may implement warning-mode schema/linter fixtures from this policy after
the accepted Phase B profile defines compatible fields. C3 may add non-blocking
capture-time warnings; D1 may classify; D2 may implement the reversible archive
workflow. None may start curation, schedule work, mutate another project, or
delete material based on this policy alone.
