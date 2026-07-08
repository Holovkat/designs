---
type: Inbox
title: Session 2026-07-08 - AGENTS hierarchy and OKF alignment
description: Session synthesis for adding DOX-style AGENTS hierarchy discipline without replacing OKF.
tags: [agents, okf, hierarchy, governance, documentation]
timestamp: 2026-07-08T06:03:52Z
branch: main
issue_refs: []
epic_refs: []
---

# Session 2026-07-08 - AGENTS hierarchy and OKF alignment

## What Was Done

Updated the root `AGENTS.md` to add an `AGENTS Hierarchy` section. The new guidance makes `AGENTS.md` files operational contracts for their subtrees, requires agents to read the root and nearest applicable child files before substantial edits, and clarifies that closer AGENTS files control local implementation details while root-level OKF, safety, and governance rules remain binding.

The closeout instructions were also expanded to require an `AGENTS.md` chain drift check before the OKF inbox synthesis step.

## Decisions Made

The DOX-style hierarchy discipline was adopted as an additive routing and contract layer, not as a replacement for OKF. `AGENTS.md` now owns local workflow, ownership, verification, and child-index routing. OKF remains the durable knowledge system for product, system, architecture, process, decision, deprecation, and state knowledge.

## What Was Deprecated

No files or concepts were deprecated. The session explicitly rejected replacing OKF with an AGENTS-only documentation model.

## Lessons Learned

The strongest part of the DOX model is local path-chain discipline: identify the touched paths, read every applicable `AGENTS.md`, and keep parent-child instructions current. The strongest part of this repository's existing model is OKF's curated knowledge taxonomy. The combined model should keep AGENTS files concise and operational while using OKF for durable knowledge.

## Current State

Root `AGENTS.md` now records the combined model. Child AGENTS files were not changed because this session only adjusted the root operating contract. Future work that changes local scope, workflow, ownership, verification, or child indexes should update the nearest owning `AGENTS.md`; future knowledge lessons should still go through OKF inbox and curation.
