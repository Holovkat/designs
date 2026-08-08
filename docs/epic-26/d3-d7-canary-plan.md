# Epic #26 D3-D7 — Bounded Canary Plan

## Authority and scope

The operator's 2026-08-08 instruction to complete Epic #26 authorizes these
named isolated canaries. It does not authorize mutation of the live source
repositories, deployment, scheduling, permanent deletion, or an `AGENTS.md`
change. Every dataset is copied from the exact tracked Git revision below into a
throwaway physical Git root. Uncommitted source-repository files are excluded.

All canaries use the current `codex/epic-26-complete` OKF tools, one executor
session, a repository-local lock/kill switch, no network, no Factory process,
no child session, no retry loop, and no scheduler. The source root's HEAD,
tracked tree hash, and worktree status are measured before and after to prove
that the canary did not mutate it.

## Common stop and rollback rules

Stop before or during mutation when root/revision/containment validation, source
hashes, proposal coverage, preflight/staging/postflight validation, lock, kill
switch, cancellation, reporting, or a declared ceiling fails. A stop may not
raise a quota or widen a selection automatically.

Rollback is confined to the throwaway snapshot: retain the report, checkpoint,
proposal, source hashes, and recovery staging; prove the selected source can be
restored byte-for-byte using Git or the manifest; then discard the throwaway
root. A source inbox item is never permanently deleted. Live roots are read
only and require no rollback because they must remain unchanged.

## D3 — small `designs` canary

| Parameter | Value |
|---|---|
| Source root | `/Users/tonyholovka/workspace/designs` |
| Frozen dataset revision | `b2efcddd44645bd56d911301ea61456b06f883ff` |
| Selection | `knowledge/inbox/2026-08-06T04-07-00Z-record-phase-b-semantic-profile-approval-26.md` |
| Expected useful output | one verified, evidence-linked Decision synthesis that is retrievable by portable text and semantic status/evidence query |
| `max_items` | 1 |
| `max_input_bytes` | 4,096 |
| `max_generated_bytes` | 262,144 |
| `max_runtime_seconds` | 30 |
| `max_sessions` | 1 |

Success requires one selected source hash preserved in `inbox/processed`, strict
postflight success, no other inbox movement, no instruction change, a terminal
report/checkpoint, one useful concept change, semantic and portable retrieval,
and no live-source mutation.

## D4 — medium active-project `fmsmercury` canary

| Parameter | Value |
|---|---|
| Source root | `/Users/tonyholovka/workspace/fmsmercury` |
| Frozen dataset revision | `d388e4df2af0641a7ea074ea1135d1021fb93094` |
| Selection | `knowledge/inbox/2026-08-04-120000-work-request-live-shared-state-architecture.md` |
| Expected useful output | one evidence-linked Architecture synthesis preserving PowerSync rejection, revision-monotonic notify-then-fetch design, always-edit rule, and pending terminal-state decision |
| `max_items` | 1 |
| `max_input_bytes` | 12,288 |
| `max_generated_bytes` | 393,216 |
| `max_runtime_seconds` | 45 |
| `max_sessions` | 1 |

The first proposal deliberately supplies an otherwise plausible invalid staged
concept to prove that C6 blocks finalization and retains the input. The reviewed
valid proposal then uses a new run ID and succeeds. Success additionally
requires the failure report to identify recoverable staged output without raw
inbox content and the valid concept to pass strict lint and both retrieval paths.

## D5 — bounded large-backlog `fms-glm` canary

| Parameter | Value |
|---|---|
| Source root | `/Users/tonyholovka/workspace/fms-glm` |
| Frozen dataset revision | `c1f9ad46c3f15d34c7b60208121e3834c382e24a` |
| Deterministic slice | the three exact Work Assignments items listed below, sorted lexically |
| Expected useful output | one consolidated Component synthesis covering shared scrollbar reveal/gutter behavior and the planned-request map toggle without duplicating the three source records |
| `max_items` | 3 |
| `max_input_bytes` | 8,192 |
| `max_generated_bytes` | 524,288 |
| `max_runtime_seconds` | 60 |
| `max_sessions` | 1 |

Selected paths:

- `knowledge/inbox/2026-07-10-work-assignments-planned-request-toggle-restoration.md`
- `knowledge/inbox/2026-07-10-work-assignments-route-scroll-reveal.md`
- `knowledge/inbox/2026-07-10-work-assignments-scrollbar-stable-gutter.md`

The harness injects one controlled interruption at a safe executor fault seam
after the first source move, proves the transaction restores the pending source
and all outputs while retaining its report/checkpoint, then performs one
explicit resume with the identical root, revision,
proposal, hashes, allowlist, and ceilings. Success requires idempotent completion,
exactly one useful consolidated concept, no duplicate output, all three original
hashes preserved in `inbox/processed`, and untouched items unchanged. Full
backlog processing is explicitly out of scope.

## Resource and usefulness measurements

Each run records wall runtime, process CPU milliseconds, snapshot disk growth,
executor input/generated-byte counters, maximum active sessions, concurrent
runs, pending count and oldest age before/after, outcome, recovery result, and
operator interventions. Numeric ceilings are the values above; concurrency and
session ceilings are both one.

A concept counts as useful only if it:

1. covers every selected source declared by the proposal;
2. preserves a decision, rule, failure mode, architecture boundary, or current
   state that would affect future work;
3. carries strict profile metadata, generated provenance, assertion state, and
   immutable evidence references;
4. is reachable by the portable fallback and at least one requested semantic
   query; and
5. is listed in its affected index and the bounded log entry.

`curation_yield = useful_concept_changes / processed_items`. Consolidation may
produce a yield below 1.0 while improving usefulness; source retention and
retrievability are mandatory and file count alone is never success.

## D6 cadence implementation gate

Only after D3-D5 pass, retain the approved `manual-explicit` cadence as enabled
in `.okf/cadence.json`. `okf-cadence-status` may run only for an explicit
operator checkpoint and never invokes the curator. No scheduled alternative is
implemented by this epic.

## D7 observation window

The observation window begins with the D3 manual checkpoint and ends after the
D5 resume and one explicit blocked-control sample. Its evidence manifest must
contain the hashed bounded reports from the canaries, ordered timestamps, exact
snapshot roots/revisions, and these ceilings:

- at least four samples;
- per-sample runtime at most 60 seconds;
- per-sample CPU at most 5,000 ms;
- per-sample disk growth at most 1 MiB;
- per-sample generated output at most 512 KiB;
- maximum sessions and concurrent runs exactly one; and
- oldest observed inbox age at most 120 days for the frozen datasets.

Every non-completed sample must have a demonstrated recovery. The observer reads
the explicit manifest once; it does not poll, sleep, schedule, start a curator,
or record raw source bodies.
