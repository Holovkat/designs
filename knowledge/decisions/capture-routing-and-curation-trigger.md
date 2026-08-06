---
type: Decision
title: Proposed Capture Routing and Explicit Curation Trigger
description: Proposed dirty-tree routing, loop-guard subjects, and bounded manual curation trigger for the two-tier inbox; requires operator approval before implementation
resource: https://github.com/Holovkat/designs/issues/31
tags: [okf, inbox, capture-tier, curation, git-hooks, governance, proposed]
timestamp: 2026-08-06T00:44:39Z
status: in-progress
issue_refs: [31]
epic_refs: [26]
decision_status: proposed-awaiting-operator-approval
---

# Context

A Tier 1 post-commit capture intentionally writes its inbox item and index row
after the developer's commit. Without a routing convention, every ordinary
commit leaves a dirty tree and the final capture of a session can remain
uncommitted. The former five-item nudge was removed because per-commit capture
would make it continuously noisy. Epic #26 records a prior cron/Factory runaway
of 57,595 sessions and 6.34 GiB, so this decision must not restore schedules or
unbounded automation.

# Proposed Decision — Requires Operator Approval

## Capture Persistence Owner and Subject Convention

`end-session` owns capture persistence, not individual developers or the
post-commit hook. At session close it must:

1. collect the current session's ordinary commit SHAs;
2. write one Tier 2 session synthesis that references those SHAs;
3. stage only pending Tier 1 captures, their `knowledge/inbox/index.md` and
   `knowledge/index.md` rows, and that Tier 2 item; and
4. commit them with `okf-capture: persist session captures`.

The post-commit hook must skip both `okf-capture:` and `okf-curation:` subjects.
This makes the persistence commit terminal rather than generating another dirty
Tier 1 item. Curators continue to commit generated concepts under
`okf-curation: <bounded batch summary>` and receive the same loop guard.

## Curation Trigger

Use an **explicit operator-triggered, repository-scoped curation check** at a
coherent sprint checkpoint or epic close. A deterministic status command may
report inbox count, age, and size when the operator asks, but must not start a
curator, schedule work, traverse a home directory, or create sessions. The
operator separately chooses whether to run one bounded curator batch.

This replaces the removed count nudge without treating a numeric threshold as
automation authority. Batch limits, locking, cancellation, resumability, and
canary evidence remain First Decision Gate work; this proposal does not approve
them.

# Alternatives Considered and Rejected

- **Nightly cron or Factory scheduling:** rejected. Epic #26's 57,595-session,
  6.34 GiB incident is a hard line-stop; no scheduler returns before bounded
  canaries and explicit gate approval.
- **Per-commit threshold nudge:** rejected. Tier 1 writes every ordinary
  commit, so the old five-item rule becomes permanent noise rather than a useful
  decision point.
- **Hook commits its own capture:** rejected. A post-commit hook mutating the
  repository cannot safely create a follow-on commit, conflicts with user work,
  and obscures ownership.
- **Every developer manually commits captures after each change:** rejected.
  It is error-prone, makes normal work noisy, and still fails to provide a
  terminal loop guard.
- **Cross-project rollout:** rejected. This decision applies only to canonical
  `designs` templates; the fms backlogs remain outside Phase A0.

# Proposed Text Changes — Not Implemented

## `templates/okf/OKF-STANDARD.md`

**Current:** Tier 2 says it is written at session close by `end-session`, but
it does not say who commits the hook-created dirty files or which commit
subjects are loop-guarded.

**Proposed:**

```md
### Capture Persistence

At session close, `end-session` stages pending Tier 1 captures and their index
rows with the one Tier 2 synthesis, then commits only those files as
`okf-capture: persist session captures`. The post-commit hook skips both
`okf-capture:` and `okf-curation:` subjects so this terminal persistence commit
does not create another Tier 1 item. Curators use
`okf-curation: <bounded batch summary>` for concept commits.
```

**Current:** the standard says curation is an explicit operator action pending a
bounded cadence, but gives no selected manual trigger.

**Proposed:**

```md
At a sprint checkpoint or epic close, an operator may run a repository-scoped
inbox-status check and explicitly request one bounded curation batch. Count,
age, and size inform that decision only; they never start curation, scheduling,
or session creation.
```

## `templates/okf/agents/okf-curator.md`

**Current:** the contract specifies Phase 3 processing and loop-prevention
responsibilities indirectly, but contains no commit-subject convention.

**Proposed after Phase 3 step 15:**

```md
16. Commit only the bounded curation output with
    `okf-curation: <bounded batch summary>`. This subject is a post-commit
    loop guard; do not use it for ordinary work or capture persistence.
```

**Current:** the contract's Input section does not require a bounded,
operator-requested invocation.

**Proposed:**

```md
The operator must explicitly request this repository-scoped curation run. Do
not schedule, self-reinvoke, traverse outside the supplied repository, or
create additional sessions. Runtime, item, and byte ceilings are introduced
only after the Epic #26 First Decision Gate approves them.
```

## `templates/okf/post-commit.sh`

**Current:**

```bash
# Skip curation commits to prevent loops
case "$COMMIT_SUBJECT" in
    okf-curation:*) exit 0 ;;
esac
```

**Proposed:**

```bash
# Skip terminal capture-persistence and curation commits to prevent loops.
case "$COMMIT_SUBJECT" in
    okf-capture:*|okf-curation:*) exit 0 ;;
esac
```

# Approval Boundary

This is a decision proposal for Epic #26 gate item A5. It authorizes no code,
skill, hook, scheduler, cron, Factory configuration, curator invocation, or
cross-project rollout. Apply the listed text only after an operator explicitly
approves this decision and its bounded-execution assumptions.
