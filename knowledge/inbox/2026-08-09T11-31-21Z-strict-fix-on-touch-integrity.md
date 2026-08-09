---
type: Inbox
title: Strict Fix-on-Touch Concept Integrity
description: Permanent concept authoring now preserves stable identity and claim-scoped integrity without rewriting retained legacy.
tags: [okf, fix-on-touch, integrity, session]
timestamp: 2026-08-09T11:31:21Z
generated_at: 2026-08-09T11:31:21Z
generated_by: end-session
session_id: 019fe631-b89d-7338-8c18-2a29224d93e7
commit_sha: [cdbdd977cc527a2f885e61467205913091c741a2]
branch: codex/epic-37-concept-42
issue_refs: [42]
epic_refs: [37]
capture_tier: session
---

# Decisions Made

Treat every direct permanent concept add, body/frontmatter edit, rename, or move as material when selected against one explicit Git baseline. Evidence metadata applies to the concept's record-level claim, while lifecycle remains separate from assertion state.

# What Was Deprecated

Path-derived identity and self-attested `verified` promotion are no longer accepted for touched concepts. Untouched legacy records retain warning-only readability and are not bulk rewritten.

# Lessons Learned

Git rename detection plus stable-ID matching handles ordinary moves without changing citations or history. A contextual `resource` cannot substitute for an independent verification reference and producer.

# Current State

Schema, generated validator, linter, curator staging, query, offline viewer, fixtures, and migration guidance enforce the shared contract. T3 operational UAT remains deferred to the epic checkpoint.
