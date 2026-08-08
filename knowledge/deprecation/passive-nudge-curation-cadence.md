---
type: Deprecation
id: okf-0d7a8c1e-9b4f-4d21-8a3c-7e5f6012b934
title: Passive Threshold Nudge Curation Cadence
description: Historical five-item post-commit nudge replaced by explicit manual status review and bounded operator-requested curation
resource: ./templates/okf/post-commit.sh
tags: [cadence, curation, deprecated, nudge, okf]
timestamp: 2026-08-08T00:00:00Z
status: deprecated
deprecated_reason: Count-based hook nudges became noisy under per-commit capture and did not prevent backlog accumulation
deprecated_date: 2026-08-08
issue_refs: [26, 31]
epic_refs: [26]
assertion_state: historical
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-contract
evidence_refs: [knowledge/decisions/curation-cadence-first-decision-gate.md, templates/okf/post-commit.sh]
---

# What Was the Issue

The former hook counted pending items and printed a reminder at five. Once the
hook began writing one Tier 1 item per ordinary commit, count became a noisy
proxy for workload, while passive reminders still allowed large backlogs to
accumulate.

# Why It Was Deprecated

Epic #26 selected explicit repository-scoped status/triage at a coherent
checkpoint and a separately requested bounded batch. The prior nudge neither
provided the required quality evidence nor safe execution authority.

# Lessons Learned

Inbox count is a review signal, not a trigger. Age, bytes, quality,
provenance, duplicates, lock/kill-switch state, usefulness, and operator intent
matter more. Hooks should remain fast and repository-local.

# When This Might Be Relevant Again

A non-mutating reminder could be reconsidered only if measured operator need
shows that explicit checkpoints are insufficient and the reminder cannot create
noise, sessions, scheduling, traversal, or execution authority.

# What to Watch Out For

Do not reintroduce `OKF_NUDGE_THRESHOLD`, a hook-launched curator, scheduler,
queue, polling loop, Factory action, or automatic retry. Any new reminder model
needs a separate decision and canary evidence.
