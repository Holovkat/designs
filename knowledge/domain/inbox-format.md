---
type: Domain
title: OKF Inbox Format
description: Complementary Tier 1 commit capture and Tier 2 session synthesis records awaiting bounded curation
resource: ./templates/okf/OKF-STANDARD.md
tags: [capture, inbox, okf, session-synthesis, tier-one, tier-two]
timestamp: 2026-08-08T00:00:00Z
status: active
id: okf-26000000-0000-4000-8000-000000000001
assertion_state: verified
generated_at: 2026-08-08T00:00:00Z
generated_by: codex-epic-26
source_authority: repository-git
evidence_refs: [templates/okf/OKF-STANDARD.md, templates/okf/post-commit.sh]
verified_at: 2026-08-08T00:00:00Z
verification_method: specification-and-hook-review
validity_basis: Current canonical capture contract for the designs repository
---

# OKF Inbox Format

Inbox records are immutable staging material for a separately requested,
repository-scoped curation run. Two capture tiers are intentionally
complementary: Tier 1 records ordinary commits compactly and Tier 2 records the
durable decisions and lessons from a meaningful session. Neither tier launches
curation, and neither is a substitute for curation.

## Common Frontmatter

Both tiers use `type: Inbox` and strict-profile records include `title`,
`description`, unique lowercase `tags`, an RFC 3339 UTC `timestamp`,
`capture_tier`, `generated_at`, and `generated_by`. They may also carry
repository, branch, issue, and epic provenance. Inbox records do not declare a
durable concept `id` or typed semantic relationships.

`commit_sha` uses full immutable Git identifiers: a string for Tier 1 and a
non-empty array for Tier 2. Legacy short SHAs and records without a tier remain
retained and auditable in warning mode; they are not silently rewritten.

## Tier 1 Commit Capture

The repository-local post-commit hook writes one `capture_tier: commit` record
after each ordinary commit. It deduplicates the exact commit SHA, normalises
tags, escapes dynamic YAML/Markdown fields, and replaces oversized or raw-dump
content with a compact Git reference. The source commit remains canonical.

Tier 1 bodies contain exactly these top-level sections in order:

```markdown
# Why And How

Why the commit was needed and how it was implemented.

# Impact

The practical effect, risk, or follow-up.
```

A merge commit is not ordinary capture input. Capture warnings are non-fatal
and do not disclose the rejected body. The explicit quality override may retain
reviewed body content, but cannot reintroduce malformed YAML or duplicate tags.

## Tier 2 Session Synthesis

At the close of a meaningful session, the `end-session` workflow writes one
`capture_tier: session` synthesis after the work is committed. It references
the relevant full commit SHAs and has a UUID `session_id`. It records only
knowledge that remains useful beyond the Tier 1 records and does not repeat a
completion summary or file-by-file diff.

Tier 2 bodies contain exactly these top-level sections in order:

```markdown
# Decisions Made

# What Was Deprecated

# Lessons Learned

# Current State
```

## Lifecycle

1. A capture is written directly under `knowledge/inbox/` and indexed.
2. Read-only status and triage may classify it without execution authority.
3. An explicit bounded curator proposal covers selected sources by path, size,
   and hash; validation must pass before finalisation.
4. Successful curation moves each source byte-for-byte to
   `knowledge/inbox/processed/` only after strict concept and maintenance
   postflight validation. A stopped finalisation restores moved sources and the
   prior output set before emitting terminal evidence.
5. Operator-reviewed archive operations are manifest-backed and reversible;
   no OKF path performs automatic permanent deletion.

See [Two-Tier Inbox Capture Cadence](../process/two-tier-inbox-cadence.md),
[Hook System](../architecture/hook-system.md), and
[Curation Pass](../process/curation-pass.md).
