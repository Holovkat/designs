---
type: Inbox
title: Session 2026-07-13 - Skill governance and staged verification
description: Central documentation alignment for deterministic skill governance and the Dev UAT versus QA application-readiness boundary.
tags: [skills, governance, verification, dev-uat, qa, ci, quarantine, documentation]
timestamp: 2026-07-13T03:35:53Z
branch: main
issue_refs: []
epic_refs: []
---

# Session 2026-07-13 - Skill governance and staged verification

## What Was Done

Added a central skill-governance reference defining ownership across designs, agent-skill-distro, project repositories, and installed harness roots. Updated the delivery lifecycle, testing template, README, rendered workflow guide, skill canonicalisation decision, distribution process, indexes, and current-state documentation.

The documented verification model now uses T1 targeted development checks, T2 sprint checkpoints, T3 Dev UAT for completed sprint or epic functionality, T4 full QA application-readiness regression, and T5 governed release verification.

## Decisions Made

Designs remains canonical for reusable workflow content explicitly authored and mapped here. Agent-skill-distro is canonical for distribution topology, harness overlays, deterministic auditing, reversible quarantine, and skill CI. Project repositories remain authoritative for local acceptance criteria, canonical environments, risk-specific commands, and the nearest AGENTS contract.

Dev UAT and QA are separate gates. Dev UAT proves the delivered sprint or epic functionality in canonical Dev. QA application readiness runs the full repository and end-to-end regression after approved deployment to canonical QA.

Repeatable structural checks should be scripts. The model selects the applicable path and interprets evidence; it should not repeatedly improvise stable validation mechanics.

## What Was Deprecated

The documentation supersedes mandatory whole-application regression after every small edit, combined QA/UAT terminology, fixed retired phase agents with per-phase full QA, globally forced verification plugins that override project staging, and persistent compressed-language modes that can reduce operational clarity.

## Lessons Learned

Calling designs the source of every skill was too broad. It created ambiguity for distro-native policy and runtime adapters. Canonical ownership must be declared per asset.

Efficient delivery does not mean removing tests. It means testing changed behavior immediately, expanding verification at coherent boundaries, and reserving full regression for the QA application-readiness gate.

## Current State

The central operating model now matches the live skill distro implemented by commits `7ef1581` and `e744271`. The distro has a strict cross-runtime audit, behavioral tests, reversible quarantine, and a GitHub Actions gate. Installed skill discovery still requires a new harness session after plugin or catalogue changes.
