---
type: Inbox
title: OKF two-tier rollout and Phase A gate
description: Session synthesis for the approved two-tier rollout, hook isolation remediation, and Phase A gate
tags: [okf, capture-tier, curation, hooks, skills, governance]
timestamp: 2026-08-06T03:20:58Z
session_id: 019fd470-7afa-7023-bdbd-0d971652dacf
commit_sha: [374104e24bf3edab627a730b4d14a034c10ba1bf, 44e72a088209ecb52138ac60658c05dd83254dc6, e575f34dc720dbfead37fef55827186ecf8c3b4e, 4c9aa397fb1be50adf30724b6b52ec5babf3a7e8, 5015ffa3fdef8b89ca76c349aae7cdebd5144842, ecb76f8, 20acf252fb92a7b4da26dd058738102b96487a92, 0d572f1e477782fa8599358786b309063e3a8c95, e5ab653c22e0bc2e7134f64415adadf494a758f3]
branch: main
issue_refs: [26, 27, 28, 29, 30, 31]
epic_refs: [26]
capture_tier: session
---

# Decisions Made

- The post-commit hook owns compact commit-local rationale; `end-session` owns
  the single complementary session synthesis and capture persistence.
- `okf-capture: persist session captures` is the terminal session-close subject,
  while `okf-curation:` is reserved for bounded curator output. Both are loop
  guards in the hook.
- The hook may not invoke a parent-workspace manifest generator: `20acf25`
  removed the cross-repository side effect and added an isolation fixture.
- The operator approved the A4 warning-first retention policy and A5 explicit,
  repository-scoped status-review model. This authorizes Phase B design, not
  scheduled or automatic curation.

# What Was Deprecated

- The active designs nudge-only hook and the unchained installer behavior are
  superseded by canonical Tier 1 capture with preserved hook chaining.
- The five-item curation nudge is retired; it was continuously noisy once every
  ordinary commit produced a capture.
- Parent-workspace manifest refresh is removed from the post-commit path; it
  violated repository isolation.

# Lessons Learned

- `core.hooksPath` can silently disable hooks retained in `.git/hooks`; a
  canonical hook must preserve and invoke a named predecessor.
- Captures written after a commit need a terminal guarded persistence commit;
  otherwise every session ends with a dirty knowledge tree.
- A scheduling incident is a design constraint, not an invitation to rebuild
  automation. Bounded, explicit operator action remains the only approved
  curation path.
- Hook code must be tested against an available parent-workspace script, not
  merely its absence, to prove it cannot trigger cross-repository work.

# Current State

- Phase A0 is complete; P0 hook isolation is fixed and covered by the hook
  suite. A4/A5 are operator-approved.
- Canonical templates, the distributed `okf` skill, and the distributed
  `end-session` skill share the two-tier cadence and terminal loop guard.
- Phase B semantic-guardrail design may proceed. Phase C needs accepted Phase B
  contracts; any canary still needs named data, numeric limits, and separate
  approval.
- The historical inbox remains intentionally uncurated. This session did not
  run curation, schedule work, launch Factory, or touch cross-project inboxes.
