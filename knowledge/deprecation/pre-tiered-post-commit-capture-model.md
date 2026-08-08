---
type: Deprecation
id: okf-2a4f6c8e-1b3d-4e75-9a02-c6d8f103b547
title: Pre-Tiered Post-Commit Capture Model
description: Historical session-only and manifest-nudge model replaced by complementary Tier 1 commit capture and Tier 2 session synthesis
resource: ./templates/okf/post-commit.sh
tags: [capture, deprecated, hooks, inbox, okf]
timestamp: 2026-08-08T00:00:00Z
status: deprecated
deprecated_reason: Session-only capture and hook manifest nudges drifted from tooling and omitted compact per-commit rationale provenance
deprecated_date: 2026-08-08
issue_refs: [26, 27, 28, 29, 30, 31]
epic_refs: [26]
assertion_state: historical
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-contract
evidence_refs: [knowledge/process/two-tier-inbox-cadence.md, knowledge/decisions/capture-routing-and-curation-trigger.md]
---

# What Was the Issue

The old model alternated between hook metadata stubs and session syntheses while
also assigning the hook viewer-manifest and threshold-nudge duties. Documentation
and live behavior diverged, and the model either lost commit rationale or
duplicated low-signal data.

# Why It Was Deprecated

The two-tier rollout established one compact rationale-bearing Tier 1 record per
ordinary commit and one complementary Tier 2 synthesis after committed work.
Terminal `okf-capture:` and `okf-curation:` subjects prevent capture loops.

# Lessons Learned

Git is already the changed-file authority. Capture should preserve why/how,
impact, provenance, decisions, deprecations, lessons, and current state without
restating file lists. Capture mechanics and curation execution are separate.

# When This Might Be Relevant Again

A project without Git hooks may need a different Tier 1 transport, but it still
needs equivalent commit identity, safe quality handling, and complementary
session synthesis rather than metadata-only stubs.

# What to Watch Out For

Do not restore manifest refresh, parent-workspace scans, five-item nudges,
subject-only metadata stubs, or pre-commit session synthesis. Preserve one
record per ordinary commit and explicit terminal persistence.
