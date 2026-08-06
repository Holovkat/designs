---
type: Inbox
title: propose capture routing and curation trigger #31
description: Commit capture for 4c9aa39
tags: [okf, okf]
timestamp: 2026-08-06T00:45:37Z
commit_sha: 4c9aa397fb1be50adf30724b6b52ec5babf3a7e8
branch: main
issue_refs: [26, 31]
capture_tier: commit
---

# Why And How

Tier 1 capture leaves post-commit knowledge changes outside ordinary commits,
and the removal of the five-item nudge left no selected curation decision.
Record a bounded, operator-controlled proposal rather than silently restoring
automation or modifying hooks before the decision gate.

subjects, and manual curation selection without scheduling or cross-project scope.

# Impact

Epic #26 has an explicit A5 input for terminal capture commits, loop
