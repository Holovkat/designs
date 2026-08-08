---
type: Architecture
title: Post-Commit Tier 1 Capture System
description: Repository-local quality-guarded hook that writes one compact rationale-bearing Tier 1 record per ordinary commit
resource: ./templates/okf/post-commit.sh
tags: [capture-tier, git, hooks, inbox, okf, quality]
timestamp: 2026-08-08T00:00:00Z
status: active
issue_refs: [26, 27, 30]
epic_refs: [26]
assertion_state: proposed
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-source
evidence_refs: [templates/okf/post-commit.sh, templates/okf/tests/post-commit_test.sh]
---

# Boundary

The Bash post-commit hook resolves one Git root and writes one direct Inbox
record for each ordinary non-merge commit. It skips `okf-capture:` and
`okf-curation:` terminal commits, deduplicates by exact commit SHA, updates the
Inbox index/count, and chains one preserved predecessor hook. It does not list
changed files because Git is canonical.

The record captures safely quoted title/branch/timestamps, full SHA, issue refs,
unique normalized tags, why/how, impact, `generated_at`, and
`generated_by: okf-post-commit`. Subject-only messages retain explicit rationale
or impact gaps.

# Quality guard

The hook measures the prospective record against a 16 KiB boundary and detects
raw credentials/private keys, binary encodings, stack traces, logs, payloads,
transcripts, database dumps, and bulk source. Unsafe, oversized, malformed, or
repeated low-signal content becomes a compact Git-reference record with
machine-readable `x_okf_capture_*` reasons. An explicit environment override may
retain reviewed content but never bypass safe YAML/Markdown structure, unique
tags, exact-SHA deduplication, or provenance.

Warnings expose only stable reason codes, SHA, and output path—not the commit
body, title, payload, or detected secret. Failure never fails the Git commit.

# Isolation

The hook canonicalizes the Git top level and writes only through physical,
non-symlink `knowledge/` and `knowledge/inbox/` directories. Symlinked or
dangling inbox/root index targets stop capture before any external read or
write. It has no viewer manifest, parent-workspace generator, curation
nudge/launch, network, scheduler, Factory, child session, or cross-project
behavior.

# Related concepts

- [Two-Tier Inbox Capture Cadence](../process/two-tier-inbox-cadence.md)
- [Pre-Tiered Post-Commit Capture Model](../deprecation/pre-tiered-post-commit-capture-model.md)
- [Inbox Quality and Retention Policy](../decisions/inbox-quality-and-retention-policy.md)
