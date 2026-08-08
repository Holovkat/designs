---
type: Process
title: Two-Tier Inbox Capture Cadence
description: Complementary quality-guarded commit and session captures with explicit manual status and bounded curation
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, inbox, capture-tier, post-commit, session-synthesis, curation]
timestamp: 2026-08-08T00:00:00Z
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

Curation is an explicit, repository-scoped operator action. The
former five-item post-commit nudge was removed because per-commit capture would
make it continuously noisy. No scheduler, cron/launchd entry, hook launch,
queue, polling, Factory/child session, automatic retry, or cross-project rollout
is part of the approved cadence. An operator may request read-only status or
triage, then separately request one exact-root, locked, quota-bounded,
validated, resumable batch.

# Related Sources

- `templates/okf/OKF-STANDARD.md` defines both item formats.
- `templates/okf/post-commit.sh` implements Tier 1 capture.
- `templates/instructional-documents/skills/okf/SKILL.md` gives agent-facing
  capture guidance.
