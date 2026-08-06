---
type: Process
title: Two-Tier Inbox Capture Cadence
description: Complementary commit-time and session-close inbox captures, with explicit operator-controlled curation pending the Epic #26 cadence decision
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, inbox, capture-tier, post-commit, session-synthesis, curation]
timestamp: 2026-08-06T00:37:41Z
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
or missing-impact markers rather than being silently discarded.

# Tier 2: Session Synthesis

At session close, `end-session` writes one `capture_tier: session` item after
the session's work is committed. It references the session commit SHAs and
contains only Decisions Made, What Was Deprecated, Lessons Learned, and Current
State. It does not repeat Tier 1 captures or include a completion-summary
section.

As of this concept, Tier 1 is installed in `designs`; #29 owns the remaining
`end-session` implementation and distribution work for Tier 2.

# Curation Cadence Boundary

Curation is currently an explicit, repository-scoped operator action. The
former five-item post-commit nudge was removed because per-commit capture would
make it continuously noisy. No scheduler, cron entry, Factory session
automation, or cross-project rollout is permitted before Epic #26's First
Decision Gate approves a bounded cadence and execution controls. #31 records
the routing and curation-trigger decision proposal; it is not an authorization
to implement automation.

# Related Sources

- `templates/okf/OKF-STANDARD.md` defines both item formats.
- `templates/okf/post-commit.sh` implements Tier 1 capture.
- `templates/instructional-documents/skills/okf/SKILL.md` gives agent-facing
  capture guidance.
