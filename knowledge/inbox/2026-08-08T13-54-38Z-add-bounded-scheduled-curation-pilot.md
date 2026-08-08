---
type: Inbox
title: 'add bounded scheduled curation pilot'
description: 'Commit capture for bdf6de4'
tags: ['okf']
timestamp: '2026-08-08T13:54:38Z'
generated_at: '2026-08-08T13:54:38Z'
generated_by: 'okf-post-commit'
commit_sha: bdf6de4ad503dcc0979a11e26692109c15f86a67
branch: 'codex/okf-bounded-scheduler-pilot'
issue_refs: []
capture_tier: commit
---

# Why And How

Replace the unsafe legacy automation path with a repository-local, one-item
adapter that pins authority, runtime, branch, revision, model binary, and
resource ceilings. The adapter uses one read-only model process, canonical
check/execute validation, exact staging, no retry or push, secret-scrubbed
subprocess environments, durable evidence, and kill-switch failure handling.

The pilot decision is limited to Designs and FMS Mercury `fmsRoadie`; Pi
Extensions, FMS GLM, the legacy curator, and the cron management server remain
excluded.

# Impact

OKF can support two staggered bounded pilot schedules after monitored,
repository-local approval, while every failure stops subsequent work and
retains recovery evidence.
