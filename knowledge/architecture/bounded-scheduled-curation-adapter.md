---
type: Architecture
id: okf-393dd215-48f3-4c65-828e-6099fe81e7a9
title: Bounded Scheduled Curation Adapter
description: One-item one-session adapter with pinned authority, relevant-only inline model context, no-retry evidence, exact commits, and fail-closed stopping
resource: templates/okf/lib/scheduled-curation.mjs
tags: [curation, fail-closed, okf, scheduler, safety]
timestamp: 2026-08-09T00:31:44Z
status: active
issue_refs: [26]
epic_refs: [26]
assertion_state: proposed
generated_at: 2026-08-09T00:31:44Z
generated_by: codex-compact-context-remediation
source_authority: repository-source
evidence_refs: [templates/okf/lib/scheduled-curation.mjs, templates/okf/tests/scheduled-curation_test.mjs]
---

# Boundary

The scheduled adapter is a narrow orchestration layer around the unchanged
operator-triggered curator. It accepts one physical Git root and one explicit
`okf-scheduled-curation/1` profile. The profile pins the canonical branch,
operator approval, model executable hash, model/reasoning choice, actionable-
only single-item selection, byte/runtime/session limits, expected outcome,
recovery plan, no-retry rule, commit policy, and kill-switch failure policy.

The installer distributes the adapter, read-only prompt, and inert example but
does not create an enabled profile, cron/launchd job, model process, or schedule.
The first named pilot is limited to Designs and FMS Mercury's `fmsRoadie` Dev
lineage.

# Execution Flow

1. Validate the exact root, branch, revision, Git state, controls, binary pin,
   and full-backlog triage; select at most one direct item whose primary
   classification is `actionable`.
2. Build and hash-bind one deterministic `okf-selected-relevant-context/1`
   pack containing the selected item, maintenance indexes/log, schema, curation
   focus, a metadata-only concept catalog, and at most twelve relevant concept
   bodies under a separate 96 KiB ceiling. Bind its exact path/role/byte/hash
   manifest into the write-once attempt key before any model call.
3. Embed the pack once in the model prompt and invoke exactly one model process
   in an empty temporary directory. The model has no filesystem, network, or
   execution tool; only the inert `TodoWrite` tool is enabled and the prompt
   directs it not to call any tool. The recommended full-prompt ceiling is
   192 KiB, with at most 26 manifest entries and 8 KiB for instructions and the
   envelope. There is no probe, auto mode, mission, retry, child session, or
   repository mutation authority.
4. Canonicalize and hash-bind the proposal draft, then run the existing
   check-only and execute paths serially against the same envelope.
5. Require the actual knowledge diff and staged manifest to equal the proposal,
   commit only those explicit paths with an `okf-curation:` subject, and never
   push.

# Failure and Evidence

Attempt and terminal reports retain the exact context manifest, per-role byte
counts, prompt utilization, selection hashes, limits, timestamps, durations,
outcomes, and recovery instructions without inbox bodies, proposal content,
credentials, or model output. Actual model input tokens are recorded only when
the wrapper supplies them; otherwise the report marks them unavailable. The
same revision/item/context envelope cannot be retried by another cron
occurrence. A successful terminal report is written and fsynced before the
scheduler lease is released.

Any timeout, process failure, malformed or oversized output, revision/source
drift, failed validation, unexpected diff, commit failure, ambiguous control,
or quota breach activates the repository-local kill switch. Recovery retains
the lease, proposal, checkpoint, report, staging, and prior knowledge state for
operator review; it never clears a stale lock, raises a quota, resumes, or
retries automatically.

# Related Concepts

- [Bounded Curation Execution Safety Requirements](../decisions/bounded-curation-execution-safety.md)
- [Curation Cadence and First Decision Gate](../decisions/curation-cadence-first-decision-gate.md)
- [OKF Offline Installer Design](./installer-design.md)
