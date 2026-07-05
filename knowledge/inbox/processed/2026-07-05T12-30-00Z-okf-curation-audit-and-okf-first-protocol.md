---
type: Inbox
title: Session 2026-07-05 - OKF curation audit phase and OKF-first protocol
description: Added an audit phase to curation (redundancy, contradictions, ambiguous refs, AGENTS.md alignment), an OKF-first consumption protocol, a portable query helper, and an inbox curation nudge
tags: [okf, curation, audit, agents-md, okf-first, memory, harness-integration]
timestamp: 2026-07-05T12:30:00Z
branch: main
---

# What Was Done

- Created the canonical okf-curator contract at `templates/okf/agents/okf-curator.md` with a new Phase 6 Audit: redundancy control (merge overlapping concepts), contradiction detection (concept vs concept, vs code, vs AGENTS.md), ambiguous reference resolution (all `resource` fields and cross-links must resolve), and an AGENTS.md alignment check that reports proposed edits and applies them only on approval.
- Added an OKF-First Protocol to the okf skill, AGENTS-OKF-SECTION.md, designs AGENTS.md, and OKF-STANDARD onboarding: query the bundle before investigating, check decisions/ and deprecation/ for rejected paths before planning, cite reused concepts, verify freshness, and record rejected approaches in session syntheses.
- Created `templates/okf/okf-query.sh`, a portable grep-based concept search (frontmatter-ranked, with a --decisions scope for prior/rejected paths), installed to `knowledge/okf-query.sh` by the installer.
- Extended `post-commit.sh` (template and designs .githooks copy) with a curation nudge when unprocessed inbox items reach 5 (OKF_NUDGE_THRESHOLD overridable).
- Extended `install-okf.sh` to install the curator to `.factory/droids/` (and `.claude/agents/` when present) and the query helper into `knowledge/`.
- Updated OKF-STANDARD.md (audit phase as Phase 6, finalize renumbered to Phase 7, corrected two-phase capture wording), DEPLOYMENT-RUNBOOK.md (Phase 1 install outputs, Phase 6 audit steps, post-deployment loop), and the curation-pass process concept.
- Extended `scripts/sync-skill-distro.sh` to sync the curator to pi-extensions/.factory/droids/ as a full per-harness copy; ran the sync and refreshed installed CLI skill roots.

# Decisions Made

- Curation cadence is a passive post-commit nudge at threshold 5, not a scheduled automation.
- Curator contract is distributed as full copies per harness, kept in sync by `sync-skill-distro.sh`; canonical source is `templates/okf/agents/okf-curator.md`.
- The curator never patches AGENTS.md directly: it reports precise proposals (current -> proposed text with reason) and offers to apply them on approval.
- Rejected approaches are first-class knowledge: syntheses must record them so curation turns them into decision or deprecation lessons.

# What Was Deprecated

- The claim that the post-commit hook writes commit metadata to the inbox (removed from AGENTS-OKF-SECTION.md, designs AGENTS.md, OKF-STANDARD.md, DEPLOYMENT-RUNBOOK.md). The hook only refreshes the viewer manifest and nudges for curation; agents write syntheses before committing.
- The pi-extensions-only curator (superseded by the canonical templates/okf/agents/ copy synced per harness).

# Lessons Learned

- Instruction docs drift from tooling silently: four documents still described the old inbox-writing hook after the hook changed. The AGENTS.md alignment check exists to catch exactly this class of contradiction.
- `knowledge/architecture/hook-system.md` still describes the old metadata-writing hook (found via okf-query during this session). Next curation pass should update or deprecate it with lessons.

# Current State

- Curation contract with audit phase is live in templates and synced to pi-extensions; okf skill with OKF-first protocol is installed canonically in all CLI skill roots.
- Drift check (`scripts/sync-skill-distro.sh --check`) reports in sync.
- Known pending curation work: hook-system.md contradiction, and this inbox plus the prior session synthesis await a curation pass.
