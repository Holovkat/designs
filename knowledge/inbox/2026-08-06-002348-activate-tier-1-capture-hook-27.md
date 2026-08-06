---
type: Inbox
title: activate Tier 1 capture hook #27
description: Commit capture for 374104e
tags: [okf, okf]
timestamp: 2026-08-06T00:23:48Z
commit_sha: 374104e24bf3edab627a730b4d14a034c10ba1bf
branch: main
issue_refs: [27]
capture_tier: commit
---

# Why And How

The active hook path still used the retired nudge-only implementation, and
installing OKF displaced existing hook managers. The canonical capture hook now
chains a preserved predecessor so both responsibilities execute after commits.

workspace indexing and pre-existing project post-commit hooks remain active.

# Impact

designs records compact commit rationale in the OKF inbox while JMRI
