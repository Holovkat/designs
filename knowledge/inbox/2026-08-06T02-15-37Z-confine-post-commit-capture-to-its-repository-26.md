---
type: Inbox
title: confine post-commit capture to its repository #26
description: Commit capture for 20acf25
tags: [okf, okf]
timestamp: 2026-08-06T02:15:37Z
commit_sha: 20acf252fb92a7b4da26dd058738102b96487a92
branch: main
issue_refs: [26]
capture_tier: commit
---

# Why And How

The canonical hook invoked a parent-workspace manifest generator after each
commit, allowing a repository-local hook to inspect sibling bundles and write
outside its root. Remove that side effect while retaining Tier 1 capture and
chained local hook behavior.

workspace scan or external manifest write.

# Impact

post-commit capture is repository-scoped and no longer triggers a
