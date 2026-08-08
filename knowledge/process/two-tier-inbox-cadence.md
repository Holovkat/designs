---
type: Process
title: Two-Tier Inbox Capture Cadence
description: Complementary quality-guarded captures with manual defaults and a named bounded scheduled-curation exception
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, inbox, capture-tier, post-commit, session-synthesis, curation, scheduled-pilot]
timestamp: 2026-08-08T13:18:09Z
status: active
issue_refs: [28]
epic_refs: [26]
---

# Purpose

OKF records development context in two complementary inbox tiers. The tiers
separate commit-local rationale from session-level decisions so the inbox has
useful provenance without duplicating Git history or repeating summaries.

# Tier 1: Commit Capture

The repository post-commit hook writes one `capture_tier: commit` item for each
ordinary commit. It extracts why/how and `Impact:` from the commit body, plus
commit SHA, branch, and issue references. Git remains authoritative for changed
files. Commits with only a subject are retained with explicit missing-rationale
or missing-impact markers. Tags and dynamic fields are normalized safely;
oversized, raw-dump, malformed, or repeated low-signal content is compacted to
a Git reference unless an operator explicitly retains reviewed content.

# Tier 2: Session Synthesis

At session close, `end-session` writes one `capture_tier: session` item after
the session's work is committed. It references the session commit SHAs and
contains only Decisions Made, What Was Deprecated, Lessons Learned, and Current
State. It does not repeat Tier 1 captures or include a completion-summary
section.

Tier 1 and the distributed `end-session` Tier 2 workflow are both implemented.

# Curation Cadence Boundary

Curation is an explicit, repository-scoped operator action. The former five-
item post-commit nudge remains removed because per-commit capture would make it
continuously noisy. Manual status/triage and a separately requested exact-root,
locked, quota-bounded batch are the default. A later operator decision may
approve the canonical scheduled adapter for one named repository and branch;
that exception is one actionable item, one read-only proposal session, no
retry, and fail-closed kill-switch handling. It never restores a hook launch,
queue, polling loop, parent-workspace runner, or broad rollout.

# Related Sources

- `templates/okf/OKF-STANDARD.md` defines both item formats.
- `templates/okf/post-commit.sh` implements Tier 1 capture.
- `templates/instructional-documents/skills/okf/SKILL.md` gives agent-facing
  capture guidance.
