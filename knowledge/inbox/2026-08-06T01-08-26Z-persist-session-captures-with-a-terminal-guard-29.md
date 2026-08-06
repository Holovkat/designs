---
type: Inbox
title: persist session captures with a terminal guard #29
description: Commit capture for 5015ffa
tags: [okf, okf]
timestamp: 2026-08-06T01:08:26Z
commit_sha: 5015ffa3fdef8b89ca76c349aae7cdebd5144842
branch: main
issue_refs: [29]
capture_tier: commit
---

# Why And How

Approved capture routing needs a terminal subject before end-session can sweep
hook-created inbox changes; otherwise persistence commits create another dirty
Tier 1 item. Align the hook, standard, curator contract, and approved decision
with the guarded session-close convention.

pending Tier 1 files cleanly, while curation stays explicit and repository-scoped.

# Impact

the distributed end-session skill can persist one Tier 2 synthesis and
