---
type: Inbox
title: Work request live shared state architecture
description: Legacy capture using the historical scalar abbreviated commit reference.
tags: [okf, work-requests]
timestamp: 2026-08-04T12:00:00Z
capture_tier: commit
commit_sha: 3944c5e
branch: legacy-fixture
---

# Why And How

The retained capture predates strict full-object commit provenance.

# Impact

Curation must surface compatibility warnings without treating an alternate
`commit_sha` schema branch as a malformed structural type.
