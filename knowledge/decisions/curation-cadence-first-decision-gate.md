---
type: Decision
title: Proposed Curation Cadence for the First Decision Gate
description: Explicit, repository-scoped, operator-requested status review and bounded manual curation recommendation; awaiting the Epic #26 First Decision Gate
resource: https://github.com/Holovkat/designs/issues/26
tags: [okf, curation, cadence, safety, operator-approval, proposed]
timestamp: 2026-08-06T02:02:04Z
status: in-progress
issue_refs: [26]
decision_status: proposed-awaiting-first-decision-gate
---

# Decision Status and Scope

This is the Epic #26 A5 recommendation, not an implementation authorization.
It selects the current operating model, identifies the First Decision Gate
inputs, and records proposed text changes only. It does not enable a scheduler,
cron, launchd job, Factory task, curator run, canary, hook deployment,
cross-project rollout, archive, deletion, or `AGENTS.md` patch.

# Evidence and Constraints

- A1 identified a canonical hook call to a parent-workspace
  `generate-all-viz.js --manifest`, which could scan sibling bundles and write
  outside the repository. The designs-only remediation `20acf25` removed that
  call; the hook fixture now proves a parent generator is not invoked. The
  First Decision Gate must retain that repository-scoped verification.
- A1 finds fms-glm and fmsroadie/fmsmercury drifted, with missing or legacy
  hooks, absent Tier 2/curator deployment, and stale inbox counts. This is
  inventory evidence, not cross-project rollout authority.
- A2 finds the designs inbox is heterogeneous: 8 pending items contain one
  current five-Tier-1-plus-one-Tier-2 group and two older legacy syntheses.
  Count alone is not a useful execution signal. Historical yield is batch-level
  only and does not measure knowledge usefulness.
- A3 records the 57,595-session, 6.34 GiB cron/Factory incident and requires
  fail-closed root validation, one-run locking, declared items/bytes/runtime/
  session ceilings, cancellation, kill switch, observability, and resumability.
- A0 approved terminal capture persistence and explicit repository-scoped
  operator curation; neither approval authorizes an automatic cadence.

# Options Considered

| Model | Benefits | Failure and operating cost | Decision |
|---|---|---|---|
| Passive manual only, no status evidence | Lowest machinery and no automatic run | Backlogs remain invisible; no comparable health evidence or explicit queue | Rejected as insufficiently observable. |
| Per-commit numeric nudge | Simple in the former model | Tier 1 writes on every ordinary commit, so a threshold becomes continuous noise; count is not workload; hook must remain fast | Rejected. |
| Threshold queue/status report | Makes count, bytes, age, and quality visible without mutation | Can be misread as execution authority; requires clear operator boundary | Accepted only as an explicit status report, never an automatic trigger. |
| Event-driven operator prompt at sprint checkpoint or epic close | Aligns review with coherent work and decision ownership | Depends on human action and a stable report contract | Accepted as the request point for status review. |
| Scheduled cron/launchd/Factory or self-reinvocation | Could reduce manual reminders | Recreates the documented runaway risk; needs resource, path, and concurrency controls not yet proven | Rejected before bounded canaries and separate approval. |
| Hybrid automatic queue plus scheduled curator | May reduce backlog age | Combines threshold noise with autonomous mutation and cumulative resource risk | Rejected. |

# Recommended Current Cadence

Adopt an **explicit, repository-scoped, operator-requested status review** at a
coherent sprint checkpoint or epic close. The review may run a deterministic
read-only `inbox-status` command against one named repository root. It reports
pending count, bytes, age, capture-tier distribution, size/quality/duplicate
warnings, and current lock/kill-switch state if a bounded runner exists.

The report does not start curation. An operator must separately request one
bounded manual curation batch, naming the repository/worktree, branch or
snapshot, item/byte/runtime/session ceilings, and the expected outcome. Until
C4/C6 and D3 pass, the only approved current action is status review and
manual planning; there is no approved curator executor.

A2's 30-day age and 10-item/16-KiB load boundaries are advisory report flags
only. They do not enqueue, schedule, notify repeatedly, create a session, or
authorize mutation.

## Authority and Stop Conditions

A valid future batch request must include the operator identity, target root,
Git revision/worktree, selected items or deterministic selection rule, positive
A3-aligned ceilings, cancellation path, kill-switch state, and a rollback or
recovery plan. It must stop before mutation when any of these is absent, when
the repository-scoped isolation preflight fails, when the root/lock/path
preflight fails, when a quota is reached, or when reporting/checkpointing cannot
be made durable.

No request may use a home directory, `/Users`, a parent workspace, broad
filesystem discovery, a global hook path, or a cross-project selection. One
repository and one executor session are the maximum scope of a run.

# First Decision Gate Checklist

The operator must approve all of the following before implementation beyond
read-only status reporting:

1. A1 deployment audit plus the `20acf25` P0 remediation and its fixture proof
   that the active canonical hook has no parent-workspace manifest call.
2. A2 baseline and the approved quality/retention choices in A4.
3. A3 safety contract: numeric item/input/generated-byte/runtime ceilings,
   one-run lock, repository-local report/checkpoint paths, cancellation,
   kill-switch authority, and recovery procedure.
4. This cadence: status review is explicit and non-mutating; batch execution is
   separately operator-requested, repository-scoped, bounded, and manual.
5. Named canary datasets, isolated worktrees/snapshots, success measures, and
   stop/rollback conditions for D3–D5.
6. Confirmation that no external bundle deployment, scheduler, or Factory
   configuration is included in the approval.

# Proposed Text Changes — Not Applied

## `templates/okf/post-commit.sh`

**Current:** the hook writes Tier 1 captures with terminal
`okf-capture:`/`okf-curation:` guards and has no parent-workspace manifest call
(after `20acf25`).

**Proposed:** preserve that repository-local boundary. Add no count threshold,
queue start, curation launch, scheduler invocation, external manifest refresh,
or another parent/workspace side effect. A future explicit repository-local
viewer-generation command may be designed separately; it is not a post-commit
side effect.

## `templates/okf/OKF-STANDARD.md`

**Current:** it permits an operator to run a repository-scoped inbox-status
check at a sprint checkpoint or epic close and separately request one bounded
batch, while noting count/age/size are not execution authority.

**Proposed:** add the A3 preflight requirements and the A4 warning-only quality
signals; state that `inbox-status` is read-only and accepts one validated root;
make the P0 no-parent-workspace rule an installation verification prerequisite;
and explicitly defer batch execution until First Decision Gate and canary
approval.

## `templates/okf/agents/okf-curator.md`

**Current:** it requires an explicit operator request and prohibits scheduling,
self-reinvocation, traversal outside the supplied repository, and additional
sessions.

**Proposed:** require a run-plan record with target root/revision, item/byte/
runtime/session ceilings, lock preflight, kill-switch/cancellation state,
deterministic selection, and terminal report/checkpoint. Refuse every mutation
when P0 isolation, root validation, lock, quota, or reportability fails.

## `templates/okf/okf-query.sh`

**Current:** it offers free-text and `--decisions` search only.

**Proposed:** add an opt-in `--inbox-status` mode that reads only the selected
repository's `knowledge/inbox/` and indexes. It emits deterministic count,
bytes, oldest age, capture-tier distribution, and A4 quality flags; it neither
writes files nor invokes a hook, curator, scheduler, network service, or
another repository.

## `templates/okf/DEPLOYMENT-RUNBOOK.md`

**Current:** Post-Deployment says agents write pre-commit session syntheses and
the hook refreshes a viewer manifest and nudges at five unprocessed items.

**Proposed:** document Tier 1 hook capture, one Tier 2 `end-session` synthesis,
terminal `okf-capture:` persistence, an explicit non-mutating status review,
and separate operator authorization for a bounded batch. Phase 1/8 verification
must resolve the absolute active hook path, compare it to canonical content,
verify chained predecessors, reject parent-workspace calls, and compare actual
inbox count to its index.

# Rejected Paths

- Any cron, launchd, Factory, polling, queue-consumer, self-reinvoking, or
  automatic retry cadence.
- Automatic curation because a count, age, size, duplicate, or malformed-item
  threshold is met.
- A global or parent-workspace hook path, manifest scan, or viewer refresh.
- Cross-project deployment or backlog processing based on the A1 inventory.
- A canary before the First Decision Gate approves A3 controls and datasets.

# Approval Boundary

The A1 P0 hook-isolation finding is remediated by `20acf25` and its parent-
generator fixture. This recommendation now awaits the operator's First Decision
Gate decision. Approval would permit only subsequent approved Phase B design and
scoped Phase C implementation packets, followed by isolated D3 planning when
their prerequisites pass; it would not permit a scheduler, broad rollout, or
automatic curation.
