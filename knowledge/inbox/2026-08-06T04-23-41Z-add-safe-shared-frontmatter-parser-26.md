---
type: Inbox
title: add safe shared frontmatter parser #26
description: Commit capture for 1dc02c2
tags: [okf, okf]
timestamp: 2026-08-06T04:23:41Z
commit_sha: 1dc02c2740028e574c9f6833f78d8b39b71042af
branch: main
issue_refs: [26]
capture_tier: commit
---

# Why And How

C2/C8/C9 need one non-mutating YAML envelope contract instead of incompatible
line parsing. Add a safe parser with structured diagnostics and synthetic
fixtures while keeping consumers and live knowledge untouched.

hooks, curation, network activity, and capture behavior remain unchanged.

# Impact

future local validators and renderers can share frontmatter semantics;
