---
type: Inbox
title: 'accept UUIDv7 session captures #26'
description: 'Commit capture for 450807d'
tags: ['okf']
timestamp: '2026-08-08T11:48:12Z'
generated_at: '2026-08-08T11:48:12Z'
generated_by: 'okf-post-commit'
commit_sha: 450807d432dd792525a1874e2ff4be4c13631255
branch: 'codex/epic-26-complete'
issue_refs: [26]
capture_tier: commit
---

# Why And How

Codex session identifiers use UUIDv7, but the strict OKF session schema only admitted versions 1 through 5. Widen the canonical UUID version nibble, regenerate the validator, update the strict fixture, and refresh the exact canary and suite evidence.

# Impact

Tier 2 session syntheses now validate strictly without weakening UUID variant or canonical-format checks.
