---
type: Decision
title: Bounded Curation Execution Safety Requirements
description: Operator-approved fail-closed requirements and regression scenarios for any future OKF curator execution
resource: https://github.com/Holovkat/designs/issues/26
tags: [okf, curation, safety, scheduling, quotas, locking, cancellation, resumability]
timestamp: 2026-08-06T03:23:02Z
status: active
issue_refs: [26]
epic_refs: [26]
decision_status: operator-approved-parameters-pending-2026-08-06
---

# Decision Status and Scope

The operator approved this Epic #26 A3 safety contract on 2026-08-06. It
converts the known scheduler incident into a fail-closed contract for any future
curator executor. It does not approve a scheduler, cron entry, Factory
configuration, curator run, canary, cross-project rollout, deletion, archive,
or `AGENTS.md` change. Numeric ceilings and named canary data remain mandatory
per-run parameters; no values are inferred by this approval.

The current baseline is explicit, repository-scoped operator curation only, as
recorded in [Capture Routing and Explicit Curation Trigger](./capture-routing-and-curation-trigger.md)
and [Two-Tier Inbox Capture Cadence](../process/two-tier-inbox-cadence.md).
This proposal constrains a future executor; it does not alter that baseline.

# Verified Facts

| Fact | Source and evidence boundary |
|---|---|
| Four former OKF cron entries were disabled after the incident. | Epic #26 Current Evidence. A3 did not inspect, alter, or reactivate cron. |
| The incident consumed 57,595 Factory OKF-curator sessions and about 6.34 GiB. | Epic #26 Current Evidence; the 2026-08-06 audit comment repeats the Phase A0 scope guard. |
| Factory was launched from `/Users/tonyholovka`, broadly scanned filesystem/session state, and sustained CPU use. | Epic #26 Current Evidence. A3 did not launch Factory or inspect its sessions. |
| Canonical templates now prohibit schedules, cron, and Factory automation before the First Decision Gate, and require an explicit repository-scoped operator request. | `templates/okf/OKF-STANDARD.md`, `templates/okf/agents/okf-curator.md`, and the local Phase A0 commit history. |
| The legacy passive-nudge wording in [Curation Audit Phase and Passive Nudge Cadence](./curation-audit-and-nudge.md) and [Post-Commit Capture Model](./post-commit-capture-model.md) is historical, not the current cadence. | The current canonical hook and the 2026-08-06 Epic #26 audit say Tier 1 capture replaced the nudge. A3 does not rewrite those historical concepts. |

These incident measurements are reported evidence, not values remeasured by
this task. No other repository was inspected or mutated.

# Assumptions and Open Parameters

- A future executor is a new, separately approved component; no such runner is
  created by A3.
- A future run starts only from a named Git worktree that contains the target
  `knowledge/` bundle. The repository root is a project boundary, never a
  discovery hint for a home-directory scan.
- `max_items`, byte ceilings, and `max_runtime_seconds` require positive,
  operator-approved values in every C/D implementation or canary packet. The
  First Decision Gate approved that requirement but selected no values.
- One execution session is the hard maximum for a run. A resume is a new,
  explicit operator request that must reacquire the lock; it may not
  self-create a child session or evade the original plan's quotas.
- The final lock, checkpoint, report, and kill-switch implementation mechanism
  is still open, but each must be repository-local and must fail closed when it
  cannot be validated.

# Proposed Decision: Fail Closed Until a Bounded Manual Run Is Approved

A curator executor may perform mutation only after every requirement below is
met. Missing approval, an unset ceiling, a failed preflight, a live lock, an
unavailable cancellation path, or an unreportable terminal state is a stop
condition, not a reason to retry or broaden scope.

## Hard Line-Stops

The following are prohibited before and after the First Decision Gate unless a
later explicit decision replaces this record:

1. **Unbounded scheduling:** no cron, launchd agent, scheduled job, queue
   consumer, timer, polling loop, self-reinvocation, Factory automation, or
   automatic session creation may start curation. A status/check command may
   describe a backlog but never launch work.
2. **Home-directory or broad host traversal:** a run may not use `/Users`, a
   home directory, `~`, `/`, or any ancestor of its validated repository root
   as its target or search scope. Absolute inputs, `..` escapes, and symlinks
   resolving outside the root are rejected.
3. **Unbounded resource use:** a run without declared item, byte, runtime, and
   session ceilings must not start. Reaching any ceiling stops intake and ends
   the run as quota-exceeded or cancelled.
4. **Concurrent mutation:** a run without a repository-scoped lock, or one
   that finds a live lock or conflicting target mutation, must not mutate.
5. **Irreversible handling:** a run may not delete inbox entries, knowledge,
   reports, checkpoints, or artifacts. Archive or deletion remains subject to
   the separately approved reversible/manifest workflow and operator approval.
6. **Uncontrolled recovery:** stale-lock clearing, retry, resumption, and
   widening a batch require explicit operator action and an auditable report;
   they are never automatic.
7. **Instruction self-modification and rollout:** no autonomous `AGENTS.md`
   patch, cross-project action, deployment, or canary follows from this record.

## Repository-Root Validation and Containment

Before enumerating an inbox or reading source context, a future executor must:

1. receive one explicit repository-root argument and canonicalise it to a
   physical path;
2. run from that exact path, not a parent or child directory;
3. prove that `git rev-parse --show-toplevel`, canonicalised to a physical
   path, equals the supplied root and that the root contains `knowledge/`;
4. reject the filesystem root, the user's home directory, `/Users`, and any
   path that is an ancestor of the validated project root;
5. construct a preflight manifest of only approved root-relative paths,
   starting with the target inbox; reject absolute paths, `..`, and a symlink
   whose resolved target leaves the repository; and
6. record the canonical root, Git revision, declared path allowlist, and
   operator request in the run report before mutation.

Repository context reads must remain within that manifest. A generic recursive
host scan, discovery from `/Users/tonyholovka`, or follow-up scan outside the
repository is forbidden.

## One-Run Locking

A future executor must acquire one atomic, repository-local lock immediately
after root validation and before enumerating items. The lock records at least a
run identifier, canonical root, process/session identity, start time, selected
limits, and current phase.

- A second invocation for the same root reports the existing lock metadata and
  exits without reading or mutating the batch.
- The lock has no reentrant or child-session mode. `max_sessions` is exactly
  one for the active run.
- Stale locks are reported, never silently removed. An operator may perform a
  later, explicit recovery only after verifying the recorded owner is no longer
  active; the recovery report preserves the old lock metadata.
- Normal completion, cancellation, and recoverable failure release the lock
  only after recording a terminal report or checkpoint. If that cannot happen,
  the lock remains a safety block.

## Quotas and Enforcement

Every run plan must declare positive, approved ceilings before it can acquire a
mutation lock:

| Dimension | Required ceiling and enforcement |
|---|---|
| Items | `max_items` bounds candidate items selected by the deterministic preflight manifest and items changed. Selection stops before item `max_items + 1`. |
| Bytes | `max_input_bytes` bounds the summed bytes of selected source material before content processing. A separate `max_generated_bytes` bounds concepts, checkpoints, reports, logs, and temporary output so disk use cannot grow independently. |
| Runtime | `max_runtime_seconds` is a wall-clock deadline, measured from lock acquisition. The executor checks it between every bounded unit of work and exits through cancellation/checkpoint handling when reached. |
| Sessions | `max_sessions: 1` permits only the explicitly requested executor session. It must not launch Factory, child curators, background workers, or replacement sessions. |

Counters are monotonic and observable. A warning may inform an operator but
never raises a cap. A cap breach fails closed, records the measured value and
terminal reason, preserves source knowledge, and requires a new explicit plan;
it must not automatically retry with a larger limit.

## Cancellation and Kill Switch

A future executor must expose an operator-controlled cancellation path before
mutation begins. Cancellation must stop new reads and writes at the next safe
unit of work, write a bounded checkpoint/report, preserve unprocessed source
items, and release the lock only after that record is durable.

It must also support a repository-local, operator-controlled kill switch that:

- blocks every new execution before enumeration or session creation;
- requests cancellation of the current run without spawning a helper session;
- records who/what activated it, the time, and the terminal state; and
- remains active until an explicit operator action clears it.

A missing, unreadable, or ambiguous kill-switch state blocks the run. Killing a
run is not permission to delete partial output, clear a lock automatically, or
restart it.

## Observability

The executor must make bounded, operator-readable evidence available without
writing raw inbox content or unbounded logs. Preflight, progress, and terminal
reports must include:

- run identifier; explicit operator request; canonical root and Git revision;
- path allowlist and deterministic item identifiers/count; declared ceilings;
- lock acquisition/release state; phase; elapsed runtime; input and generated
  byte counters; active and maximum session counts; and last checkpoint;
- terminal outcome (`completed`, `cancelled`, `quota-exceeded`, `blocked`, or
  `failed`) with a concise reason and recovery instruction; and
- whether any source item, concept, archive, or instruction file was changed.

A report that cannot establish these fields is a failed run. Reports themselves
are included in the generated-byte ceiling and remain repository-scoped.

## Resumability and Recovery

Before mutation, the executor must produce a deterministic, bounded plan with
ordered item identifiers, source hashes, root/Git identity, path allowlist, and
approved limits. It checkpoints after each safe unit or phase without treating
an item as processed until postflight validation and the required persistence
step succeed.

An explicit resume request may use a checkpoint only when the canonical root,
input hashes, path allowlist, and approved limits still match. If they differ,
it must block and require a new dry-run plan. Resumption must be idempotent:
replaying a completed unit cannot duplicate a concept, move/delete an inbox
item twice, create another session, or exceed the plan's ceilings. Partial
failure leaves a manifest of untouched inputs and generated outputs for
operator review.

# Explicit Rejections

- **Unbounded scheduled curation:** rejected. The documented 57,595-session,
  6.34 GiB incident makes automatic recurrence unsafe; a numeric backlog
  threshold is information, not execution authority.
- **Factory launch from a home directory or broad filesystem discovery:**
  rejected. It violates the repository boundary and recreates the incident's
  broad scanning failure mode.
- **Retry-until-success and auto-resume:** rejected. They hide cumulative
  runtime, session, and disk growth and bypass operator approval.
- **Lock-free “read-only” starts that can later mutate:** rejected. Scope,
  quota, and concurrency checks must happen before enumeration and mutation.
- **Cleanup-as-recovery:** rejected. Deleting artifacts or inbox items cannot
  repair an unsafe run; recovery must be manifest-backed and approved.

# Future Acceptance Criteria and Regression Test Matrix

No row below is executed by A3 because there is no runner. The rows are
required T1 regression scenarios for C4/C5 implementation and must be repeated
in the manual canaries owned by D3–D5. Fixtures must be throwaway Git
repositories; no test may use a home directory, live inbox, cron, or Factory.

| Scenario | Fixture / stimulus | Required assertion |
|---|---|---|
| Explicit manual authority | Invocation missing an operator request, or marked scheduled/event-driven | Fails before root discovery, lock acquisition, or session creation. |
| Root identity | Non-Git directory, child directory, parent directory, `/`, `$HOME`, and `/Users` | Each is rejected before enumeration; a valid worktree root is accepted only when its Git top level exactly matches. |
| Containment | Root-relative `..`, absolute path, and symlink escaping a throwaway repo | Preflight rejects each path and records no outside-root read/write. |
| No scheduler or Factory path | Static configuration scan plus a mocked launcher | No scheduler configuration is accepted and no Factory/child-session launcher is called. |
| Live lock contention | Two concurrent attempts against one fixture root | First obtains one lock; second exits with lock metadata and changes no files. |
| Stale-lock safety | Lock whose recorded owner is absent | Default run blocks; only a separately explicit recovery path can proceed and preserves prior lock evidence. |
| Item and byte caps | Manifests at, below, and one unit above `max_items`, `max_input_bytes`, and `max_generated_bytes` | Over-limit plan fails before processing; at-limit plan never exceeds any counter or disk-output cap. |
| Runtime and session caps | Controlled clock reaches deadline; mock requests a second/child session | Deadline checkpoints and terminates; `max_sessions: 1` rejects every additional session and no retry starts. |
| Cancellation and kill switch | Cancel during a unit; activate the kill switch before and during a run | New runs remain blocked; active work reaches a safe checkpoint, preserves input, reports cancellation, and does not self-restart. |
| Observability | Completed, blocked, quota-exceeded, cancelled, and failed fixtures | Each bounded report contains root, revision, limits, counters, lock state, checkpoint, terminal reason, and no raw inbox dump. |
| Deterministic resume | Interrupt after item _n_, then resume with matching and changed source hashes | Matching plan completes without duplicates; changed hashes block resume and require a new explicit plan. |
| Non-destructive partial failure | Fail postflight after generated output but before persistence | Input remains recoverable, processed state is not advanced, and a manifest identifies partial output; no deletion or `AGENTS.md` write occurs. |

# Required Parameters Before Any Execution

The First Decision Gate approved this contract, but each execution-relevant
packet must still select numeric ceilings, byte-accounting rules, canonical
lock/checkpoint/report locations, kill-switch authority, named canary dataset,
and success measures. C4 and C5 may implement the contract behind targeted
fixture tests after their Phase B dependencies are accepted; D3–D5 may run only
separately approved bounded manual canaries. A5's cadence choice cannot weaken
these requirements, and no cadence or rollout is authorized by this A3 record.
