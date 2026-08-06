---
type: Inbox
title: OKF two-tier rollout completion
description: Session synthesis for the approved Tier 1, Tier 2, and bounded curation-routing rollout
tags: [okf, capture-tier, curation, hooks, skills]
timestamp: 2026-08-06T01:08:42Z
session_id: 019fd470-7afa-7023-bdbd-0d971652dacf
commit_sha: [374104e24bf3edab627a730b4d14a034c10ba1bf, 44e72a088209ecb52138ac60658c05dd83254dc6, e575f34dc720dbfead37fef55827186ecf8c3b4e, 4c9aa397fb1be50adf30724b6b52ec5babf3a7e8, 5015ffa3fdef8b89ca76c349aae7cdebd5144842, ecb76f8]
branch: main
issue_refs: [27, 28, 29, 30, 31]
epic_refs: [26]
capture_tier: session
---

# Decisions Made

- The post-commit hook owns compact commit-local rationale; `end-session` owns
  the single complementary session synthesis and capture persistence.
- `okf-capture: persist session captures` is the terminal session-close subject,
  while `okf-curation:` is reserved for bounded curator output. Both are loop
  guards in the hook.
- Curation remains an explicit repository-scoped operator decision at a sprint
  checkpoint or epic close. No numeric threshold is execution authority.

# What Was Deprecated

- The active designs nudge-only hook and the unchained installer behavior are
  superseded by canonical Tier 1 capture with preserved hook chaining.
- The five-item curation nudge is retired; it was continuously noisy once every
  ordinary commit produced a capture.

# Lessons Learned

- `core.hooksPath` can silently disable hooks retained in `.git/hooks`; a
  canonical hook must preserve and invoke a named predecessor.
- Captures written after a commit need a terminal guarded persistence commit;
  otherwise every session ends with a dirty knowledge tree.
- A scheduling incident is a design constraint, not an invitation to rebuild
  automation. Bounded, explicit operator action is the only approved curation
  path at this stage.

# Current State

- Issues #27, #28, #30, and #31 are closed with T1 evidence; #29 is implemented
  and awaits this session-close verification and tracker handoff.
- Canonical templates, the distributed `okf` skill, and the distributed
  `end-session` skill share the two-tier cadence and terminal loop guard.
- The historical inbox remains intentionally uncurated. This session did not
  run curation, schedule work, launch Factory, or touch cross-project inboxes.
