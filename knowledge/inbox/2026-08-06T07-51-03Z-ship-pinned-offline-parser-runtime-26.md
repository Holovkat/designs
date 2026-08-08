---
type: Inbox
title: ship pinned offline parser runtime #26
description: Commit capture for 667ef0e
tags: [okf, okf]
timestamp: 2026-08-06T07:51:03Z
commit_sha: 667ef0e1778d6cd927a15dbd6fc6df0bfd5535d9
branch: main
issue_refs: [26]
capture_tier: commit
---

# Why And How

Installed parser consumers need the same C7 YAML implementation without host
resolution or runtime package installation. Vendor the reviewed yaml artifact,
record its lock/integrity, and install it with the parser as a copy-only seam.

hook, curator, scheduler, or knowledge bundle runs during installation.

# Impact

future C6/C8/C9 consumers can load the parser offline; no command,
