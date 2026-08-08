---
type: Inbox
title: harden Tier 1 capture mechanics #30
description: Commit capture for e575f34
tags: [okf, okf]
timestamp: 2026-08-06T00:43:55Z
commit_sha: e575f34dc720dbfead37fef55827186ecf8c3b4e
branch: main
issue_refs: [30]
capture_tier: commit
---

# Why And How

The initial capture hook used a nonstandard filename, captured merge and amend
noise, and appended index rows outside the table while leaving the root count
stale. Align capture naming and make index updates idempotent and visible.

commit, render in the inbox table, and keep the root Inbox count accurate.

# Impact

inbox captures sort with the documented ISO form, represent one logical
