---
type: Inbox
title: propose Phase B semantic profile scope #26
description: Commit capture for e0d4c15
tags: [okf, okf]
timestamp: 2026-08-06T03:58:20Z
commit_sha: e0d4c15ab9e3b26945014981307f2f776a5aec69
branch: main
issue_refs: [26]
capture_tier: commit
---

# Why And How

Phase B reconciles the core profile, typed relationships, provenance, and
vocabulary mapping into a native warning-first design. The isolated spike shows
only deterministic offline JSON serialization, so semantic-web dependencies are
deferred rather than guessed.

SHACL, curation, scheduling, and rollout remain approval-gated.

# Impact

Phase C has a bounded profile/parser/linter handoff while JSON-LD, RDF,
