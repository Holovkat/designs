---
type: Process
title: OKF Bounded Curation Pass
description: Explicit proposal-driven workflow with exact-root isolation, quotas, validation, checkpoints, recovery, and approval boundaries
resource: ./templates/okf/agents/okf-curator.md
tags: [okf, curation, inbox, validation, recovery, audit]
timestamp: 2026-08-08T00:00:00Z
status: active
issue_refs: [26]
epic_refs: [26]
assertion_state: proposed
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-contract
evidence_refs: [templates/okf/agents/okf-curator.md, templates/okf/bin/okf-curate.mjs]
---

# Request and plan

Status and triage are explicit-root read-only evidence. They never trigger
curation. A separate operator request names the physical Git root and revision,
identity/reference, run ID, deterministic selected items and hashes, approved
context, positive item/input/generated-byte/runtime ceilings, one session,
expected outcome, cancellation, and recovery.

The curator synthesizes only that bounded packet into an
`okf-curation-proposal/1`. Every selected source is covered by at least one
concept output; outputs are uniquely sorted and include all affected type
indexes, `knowledge/index.md`, `knowledge/inbox/index.md`, and
`knowledge/log.md`, with source coverage, proposed content, expected target
hashes, and generated provenance.

# Execution

`okf-curate --check-only` proves root/revision/containment, controls, source and
proposal hashes, deterministic selection, quotas, and legacy preflight without
mutating. `--execute` acquires one repository-local lock, stages and strictly
validates concepts plus index/log maintenance, applies/checkpoints the complete
bounded output set, postflights it, and only then moves selected source records
to `inbox/processed/`. A stop during finalization restores any moved source and
rolls every output back to retained recovery paths.

An active or stale lock, ambiguous kill switch, source/proposal drift, escaping
path, quota, cancellation, or validation/reporting failure stops the run. Input,
staged/failed output, checkpoint, report, and backups remain recoverable. Resume
is one new explicit request with the identical plan, hashes, proposal,
root/revision, allowlist, and limits; it is idempotent and never self-retries.
Prior terminal reports are write-once; a later explicit attempt has a separate
attempt identity.

# Knowledge audit

Within the approved context, the curator consolidates redundancy, distinguishes
historical/stale/proposed/inferred/verified assertions, preserves contradiction
and rejected-path lessons, sharpens resources and citations, maintains stable
typed relationships, updates indexes/log, and reports AGENTS.md alignment as
proposals. The replacement declares `supersedes` against the retained old
concept ID. The runner cannot patch AGENTS.md, invoke a network service, create
a schedule/Factory/child session, archive/delete sources, or traverse a parent
workspace.

# Archive boundary

Archive/compaction is a separate reversible manifest workflow with explicit
selection, hashes, approval, destination receipts, index snapshots, rollback,
write-once attempt reports, and no permanent-delete command. Its success does
not authorize curation or deletion.

# Related concepts

- [Bounded Curation Execution Safety](../decisions/bounded-curation-execution-safety.md)
- [Curation Cadence and First Decision Gate](../decisions/curation-cadence-first-decision-gate.md)
- [Inbox Quality and Retention Policy](../decisions/inbox-quality-and-retention-policy.md)
- [Deploy OKF to a Project](./deploy-okf.md)
