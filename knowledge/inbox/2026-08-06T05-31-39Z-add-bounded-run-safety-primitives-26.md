---
type: Inbox
title: add bounded run-safety primitives #26
description: Commit capture for 83249e9
tags: [okf, okf]
timestamp: 2026-08-06T05:31:39Z
commit_sha: 83249e95d058b5f3c63c57baea1a9759257b31a7
branch: main
issue_refs: [26]
capture_tier: commit
---

# Why And How

Future curation needs fail-closed local controls before any separately approved
manual run. Add fixture-only root, plan, lock, kill-switch, evidence, and
resume seams with a check-only preflight command.

canary, scheduler, live knowledge mutation, or default execution quota.

# Impact

later C4/C5 work has tested safety controls without a curator,
