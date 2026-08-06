---
type: Inbox
title: add core profile schema fixtures #26
description: Commit capture for 8262c9b
tags: [okf, okf]
timestamp: 2026-08-06T04:17:20Z
commit_sha: 8262c9be5655e382a8721cbe504b72e00d3383b3
branch: main
issue_refs: [26]
capture_tier: commit
---

# Why And How

The approved native profile needs deterministic strict and legacy-compatible
frontmatter evidence before a linter or parser can consume it. Add the
versioned schema, synthetic fixtures, and an Ajv runner without touching live
knowledge or capture behavior.

warning-only and no hook, curator, schedule, or semantic-web dependency starts.

# Impact

C2/C7 receive a tested profile contract; historical records remain
