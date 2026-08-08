---
type: Inbox
title: add read-only inbox status command #26
description: Commit capture for b578c43
tags: [okf, okf]
timestamp: 2026-08-06T07:59:13Z
commit_sha: b578c43d74e63a7b173fbd7923216238c541a7dd
branch: main
issue_refs: [26]
capture_tier: commit
---

# Why And How

Operators need deterministic inbox health evidence without turning backlog
signals into a curation trigger. Add the explicit-root C6 status projection,
fixture coverage, and offline installed command seam.

scheduling, network access, or execution authority.

# Impact

inbox health is observable without writes, lock changes, curation,
