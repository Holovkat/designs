---
type: Inbox
title: OKF Phase A gate and Phase B semantic design
description: Session synthesis for the two-tier rollout, Phase A gate, and Phase B semantic-profile decision
tags: [okf, capture-tier, curation, hooks, skills, governance, semantic-profile]
timestamp: 2026-08-06T05:46:55Z
session_id: 019fd470-7afa-7023-bdbd-0d971652dacf
commit_sha: [374104e24bf3edab627a730b4d14a034c10ba1bf, 44e72a088209ecb52138ac60658c05dd83254dc6, e575f34dc720dbfead37fef55827186ecf8c3b4e, 4c9aa397fb1be50adf30724b6b52ec5babf3a7e8, 5015ffa3fdef8b89ca76c349aae7cdebd5144842, ecb76f8, 20acf252fb92a7b4da26dd058738102b96487a92, 0d572f1e477782fa8599358786b309063e3a8c95, e5ab653c22e0bc2e7134f64415adadf494a758f3, c0c46f39b8e81a6c5613792aeb45620aeb38b52f, e0d4c15ab9e3b26945014981307f2f776a5aec69, be07530fdde907745a79b6689d38b6ec2859586c, 8262c9be5655e382a8721cbe504b72e00d3383b3, 1dc02c2740028e574c9f6833f78d8b39b71042af, 241d4c77d395730dbb42b6586f4a38219cd03d20, 83249e95d058b5f3c63c57baea1a9759257b31a7, 85fe8fe85519e0bc6fe3207ca666ea245776b083, 86a6bbcc9e312e4a3126095933825d565b2db0ac]
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
  repository-scoped status-review model. This authorized Phase B design, not
  scheduled or automatic curation.
- The operator approved a portable native semantic profile, stable typed
  relationships, and flat provenance/assertion metadata. JSON-LD/RDF/SHACL are
  deferred pending a future namespace/consumer decision.
- C1 adds the `okf-core/1.0` frontmatter schema, synthetic strict/legacy
  fixtures, and deterministic Ajv evidence. It does not validate live records
  or modify capture, curation, or scheduler behavior.
- C7 adds a safe shared YAML frontmatter parser with separate envelope
  diagnostics and raw-body preservation. It does not yet change consumers.
- C2 adds the warning-first local linter on C1/C7, with deterministic
  text/JSON diagnostics, path confinement, and synthetic fixtures. It does not
  mutate a live bundle or trigger work.
- C4/C5 add fixture-only, standard-library safety primitives for a future
  separately approved bounded run: exact-root/revision validation, explicit
  caps, kill switch, atomic lock, bounded report/checkpoint, and resume checks.
  They contain no executor, curator, scheduler, canary, or knowledge mutation.
- The operator approved a narrow local parser-runtime distribution addendum for
  installed C8/C9 consumers. It still forbids runtime dependency installation,
  network access, and all curation/canary or semantic-web expansion.
- The operator approved the C6 contract: a deterministic, explicit-root,
  advisory-only inbox status report. It has no execution authority and remains
  pending the local parser-runtime packaging seam.

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
  suite. A1/A2 evidence and the approved A3/A4/A5 records are now canonical.
- Canonical templates, the distributed `okf` skill, and the distributed
  `end-session` skill share the two-tier cadence and terminal loop guard.
- Phase B semantic-guardrail design and its B5 decision are operator-approved.
  C1, C7, C2, C4, and C5 are green at T1. Local runtime packaging is approved
  to unblock C8/C9; C6 now has an approved read-only contract but awaits that
  packaging seam. C3 remains separately bounded by A3/A4/A5. Any canary still
  needs named data, numeric limits, and separate approval.
- The historical inbox remains intentionally uncurated. This session did not
  run curation, schedule work, launch Factory, or touch cross-project inboxes.
