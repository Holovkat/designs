---
type: Inbox
title: 'enforce fix-on-touch concept integrity'
description: 'Commit capture for cdbdd97'
tags: ['okf']
timestamp: '2026-08-09T11:30:57Z'
generated_at: '2026-08-09T11:30:57Z'
generated_by: 'okf-post-commit'
commit_sha: cdbdd977cc527a2f885e61467205913091c741a2
branch: 'codex/epic-37-concept-42'
issue_refs: [42]
capture_tier: commit
---

# Why And How

Require stable identity, separate lifecycle/assertion state, generation mechanism, and claim-scoped evidence for new or materially changed permanent concepts. Derive the touched set from one explicit Git baseline, preserve valid IDs across moves/deprecation, and reject deletion, reversed replacement direction, or unsupported verification while leaving untouched legacy warning-only.

Issue: #42

# Impact

Schema, generated validator, lint/curation gates, query/viewer projections, fixtures, and migration guidance now share the strict-new integrity contract without bulk rewrites.
