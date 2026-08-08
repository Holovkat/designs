---
type: Decision
title: Read-Only Inbox Status Contract
description: Operator-approved A5/D1 support contract for explicit repository-local inbox health reporting without curation authority
resource: docs/epic-26/c6-read-only-inbox-status-contract.md
tags: [okf, inbox, status, curation-safety, read-only, triage]
timestamp: 2026-08-06T05:37:13Z
status: active
issue_refs: [26]
epic_refs: [26]
decision_status: operator-approved-a5-d1-contract-2026-08-06
---

# Decision

The operator approved this A5/D1 support surface as an explicit,
repository-local, read-only inbox
status command. It measures a named bundle's direct pending inbox and reports
advisory quality, provenance, index, lock, and kill-switch facts. It neither
starts nor authorizes curation.

# Constraints

The status command requires an absolute physical Git worktree root and rejects inferred roots,
parent/home traversal, symlinks, and external scope. It has no execution,
selector, quota, scheduling, notification, mutation, archive/delete, or
cross-project behavior. Its findings remain warning-first report data; a status
report may not be interpreted as readiness, a queue, a trigger, or permission
to run a curator.

The status command must reuse the approved C7 parser, C2-compatible diagnostics, and C4/C5
read-only control-state readers. It must be distributed through the separately
approved local parser-runtime packaging design and must not install/fetch
dependencies at runtime or substitute an ad-hoc parser.

# Approval Boundary

The `okf-inbox-status.mjs` command and its synthetic fixture evidence are
implemented in the canonical template. It remains a local read-only projection;
no live-inbox canary has been run.

This decision authorizes A5/D1 status contract documentation and fixture-only
implementation work. It does not authorize a live-inbox canary, curator run,
scheduler, hook integration, dependency refresh, archive/deletion, JSON-LD/RDF/
SHACL, `AGENTS.md` changes, or cross-project rollout. Any future curation run
still needs its own named dataset, limits, success measures, stop/rollback plan,
and explicit operator approval.

# Task Label Correction

This record was originally labelled C6. Epic C6 means preflight, staging, and
postflight validation inside the bounded curator and is implemented separately.
This read-only status surface belongs to the A5 manual cadence and supports D1
classification; the correction changes no authority or runtime behavior.
