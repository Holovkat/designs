---
type: Decision
title: Curation Audit Phase and Passive Nudge Cadence
description: Phase 6 Audit added to curation (redundancy, contradictions, ambiguous refs, AGENTS.md alignment); curation cadence is a passive post-commit nudge at threshold 5
resource: ./templates/okf/agents/okf-curator.md
tags: [okf, curation, audit, redundancy, contradictions, agents-md, nudge, cadence]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# Decision: Curation Audit Phase and Passive Nudge Cadence

## Context

The original curation workflow processed inbox items into concepts but did not audit the existing bundle for quality issues. Over time, this led to:

- **Redundancy:** Concepts overlapping in scope without being literal duplicates.
- **Contradictions:** Concepts describing behavior the codebase no longer follows (e.g., the hook-system concept describing the old inbox-writing hook after the hook changed).
- **Ambiguous references:** `resource` fields pointing at directories when specific files existed, broken cross-links, undefined terms.
- **AGENTS.md drift:** Agent instructions referencing files, hooks, commands, or behavior that had changed or no longer existed.

Additionally, there was no automatic reminder to run curation. Inbox items could accumulate indefinitely without anyone noticing.

## Decision

### 1. Add Phase 6 Audit to Curation

The curation workflow now includes a mandatory audit phase that runs on every curation pass, even when the inbox is empty:

- **6a. Redundancy control:** Identify concepts that overlap in scope. Merge them into one canonical file, preserve all unique reasoning, move the merged-away file to `deprecation/` with a `supersedes` link. Where a concept duplicates a legacy doc, cut the body to summary + classification and let `resource` carry the detail.
- **6b. Contradiction detection:** Check concept vs concept, concept vs code reality, and concept vs AGENTS.md. Resolve in favor of verified current reality. Record formerly-true claims in `deprecation/` as lessons; correct simply-wrong claims in place.
- **6c. Ambiguous reference resolution:** Verify every `resource` field and cross-link resolves. Sharpen vague references so an agent can follow them without guessing.
- **6d. AGENTS.md alignment:** Compare AGENTS.md (including nested copies) against the knowledge bundle and tooling. Report each mismatch as a precise proposed edit (current text -> proposed text, with reason). Do NOT patch AGENTS.md directly; apply proposals only on operator approval and log the change.

### 2. Passive Nudge Cadence

Curation cadence is a passive post-commit nudge, not a scheduled automation. The post-commit hook counts unprocessed inbox items and prints a reminder when the count reaches a configurable threshold (default 5, overridable via `OKF_NUDGE_THRESHOLD`).

### 3. Curator Never Patches AGENTS.md Directly

The curator reports AGENTS.md alignment proposals as precise edits and offers to apply them on approval. This prevents automated agent modifications to agent instructions without human oversight.

## Rationale

- **Audit catches silent drift:** The hook-system contradiction (concept described old hook behavior after the hook changed) is exactly the class of problem the audit phase is designed to catch. Without auditing, contradictions accumulate silently.
- **Passive nudge over scheduled automation:** A scheduled cron that runs curation automatically could conflict with active work, produce concepts at inconvenient times, and require infrastructure. A passive nudge in the post-commit hook is simpler, requires no scheduling infrastructure, and lets the developer decide when to curate.
- **Threshold 5 balances signal and noise:** One or two inbox items do not justify a curation pass. Five items suggest enough accumulated work to synthesize coherently. The threshold is configurable per project.
- **AGENTS.md is agent instructions, not agent-modifiable:** Allowing the curator to patch AGENTS.md directly would let automated processes modify the instructions that govern automated processes. Reporting proposals and applying on approval keeps a human in the loop.

## What Was Done

- Created the canonical okf-curator contract at `templates/okf/agents/okf-curator.md` with the full 7-phase workflow (Phases 1-5 existing, Phase 6 Audit new, Phase 7 Finalize renumbered).
- Extended `post-commit.sh` with the curation nudge (threshold 5, `OKF_NUDGE_THRESHOLD` overridable).
- Extended `install-okf.sh` to install the curator to `.factory/droids/` (and `.claude/agents/` when present).
- Updated `OKF-STANDARD.md` (audit phase as Phase 6, finalize as Phase 7, corrected two-phase capture wording).
- Updated `DEPLOYMENT-RUNBOOK.md` (Phase 1 install outputs, Phase 6 audit steps, post-deployment loop).
- Updated the `curation-pass.md` process concept to reflect the audit phase.
- Extended `scripts/sync-skill-distro.sh` to sync the curator to `pi-extensions/.factory/droids/`.

## What Was Deprecated

- The claim that the post-commit hook writes commit metadata to the inbox (removed from AGENTS-OKF-SECTION.md, designs AGENTS.md, OKF-STANDARD.md, DEPLOYMENT-RUNBOOK.md). See [Post-Commit Inbox Capture (Deprecated)](../deprecation/post-commit-inbox-capture.md).
- The pi-extensions-only curator (superseded by the canonical `templates/okf/agents/` copy synced per harness).

## Lessons Learned

- Instruction docs drift from tooling silently: four documents still described the old inbox-writing hook after the hook changed. The AGENTS.md alignment check exists to catch exactly this class of contradiction.
- The curator contract must be distributed as full copies per harness (not symlinks) because different harnesses have different agent discovery mechanisms. `sync-skill-distro.sh` keeps them in sync.

## Alternatives Considered

- **Scheduled cron curation (nightly):** Rejected because it requires scheduling infrastructure, can conflict with active work, and produces concepts at inconvenient times. The passive nudge is simpler and developer-controlled.
- **Audit only on explicit request:** Rejected because drift accumulates silently. Making the audit mandatory on every curation pass ensures it runs regularly.
- **Curator patches AGENTS.md directly:** Rejected because it creates a feedback loop where automated processes modify their own instructions. The report-and-approve model keeps human oversight.

## Related Concepts

- [Curation Pass](../process/curation-pass.md) - The full curation workflow including the audit phase
- [OKF-First Protocol](./okf-first-protocol.md) - The consumption protocol that relies on audit-clean concepts
- [Hook System](../architecture/hook-system.md) - The hook that implements the curation nudge
- [Post-Commit Inbox Capture (Deprecated)](../deprecation/post-commit-inbox-capture.md) - The old hook design that the audit caught
