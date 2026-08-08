---
type: Inbox
title: add warning-first profile linter #26
description: Commit capture for 241d4c7
tags: [okf, okf]
timestamp: 2026-08-06T04:31:54Z
commit_sha: 241d4c77d395730dbb42b6586f4a38219cd03d20
branch: main
issue_refs: [26]
capture_tier: commit
---

# Why And How

The schema and shared parser need a deterministic local diagnostic surface
before capture or curation integration. Add strict/legacy lint modes, JSON/text
output, root-contained traversal, and synthetic fixture coverage.

hooks, curation, scheduling, and external repositories remain untouched.

# Impact

C3/C6/D1 can consume a stable read-only linter contract; live knowledge,
