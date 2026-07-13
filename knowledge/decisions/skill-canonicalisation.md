---
type: Decision
title: Workflow Skill Canonicalisation
description: Designs owns reusable workflow content while agent-skill-distro owns distribution policy, runtime overlays, deterministic auditing, quarantine, and skill CI
resource: ./scripts/sync-skill-distro.sh
tags: [skills, canonicalisation, distribution, agent-skill-distro, skill-md, commands, okf]
timestamp: 2026-07-13T03:35:53Z
status: active
---

# Decision: Workflow Skill Canonicalisation

## Context

The designs repo contains project-local skills in `templates/instructional-documents/skills/` and workflow commands in `templates/instructional-documents/commands/`. Some skills and commands overlapped in purpose (e.g., `plan-review` skill and `commands/plan-review.md`), leading to duplication and drift. Skills were also distributed manually to CLI skill roots (`~/.codex/skills`, `~/.claude/skills`, etc.), which was error-prone and led to divergent copies.

A second issue: the OKF skill (`templates/instructional-documents/skills/okf/SKILL.md`) lacked YAML frontmatter (`name`, `description`, trigger phrases), which meant CLI harnesses could never auto-trigger it. It had been effectively undeployable since creation.

## Decision

1. **Designs is canonical for reusable workflow content authored here.** Skills under `templates/instructional-documents/skills/`, operating-model guidance, and reusable templates are edited in this repo and synced outward.
2. **SKILL.md is canonical over command files.** Where a skill and a command cover the same workflow, the SKILL.md holds the full content and the command file is a thin pointer to the skill.
3. **Agent-skill-distro is canonical for distribution mechanics and policy.** It owns shared and harness-specific roots, runtime adapters, deterministic audits, quarantine manifests, and skill CI. Distro-native skills do not need a duplicate source in designs.
4. **Three-layer distribution model:** designs reusable content -> agent-skill-distro distribution and policy -> installed CLI roots. `scripts/sync-skill-distro.sh` manages only explicitly mapped assets.
5. **Project repositories remain authoritative for local behavior.** Their nearest `AGENTS.md`, project skills, acceptance criteria, canonical environments, and risk-specific commands override generic workflow detail without weakening global safety or release authority.
6. **The OKF skill is globally distributed** via the distro's `shared/skills/okf` with per-target symlinks.

## Rationale

- **Explicit source of truth:** Reusable content is edited in designs; runtime policy is edited in the distro; project-specific contracts stay with the project. This prevents circular copying and false claims that every skill must exist in all repositories.
- **SKILL.md over commands:** Skills have richer metadata (YAML frontmatter with trigger phrases) and are auto-discoverable by CLI harnesses. Commands are invoked explicitly. Making SKILL.md canonical ensures the auto-triggerable version has the full content.
- **Three-layer model:** Keeps the separation clean. Designs owns content, distro owns distribution, CLI roots are consumers. The `--check` mode of the sync script catches drift.
- **Frontmatter is required for triggering:** Without `name` and `description` in YAML frontmatter, a skill is invisible to CLI harnesses. This is now enforced by the canonicalisation process.

## What Was Done

- Fixed the OKF skill: added YAML frontmatter (name, description, trigger phrases), added a `<designs>` repo-root resolution rule replacing machine-specific paths.
- De-duplicated `plan-review` and `release-assess`: SKILL.md is canonical (merged the richer command content in); `commands/plan-review.md` and `commands/release-assess.md` are thin pointers.
- Enriched `vibe-fix` description with trigger phrases from the drifted codex fork.
- Normalized frontmatter on `worktree-session-lifecycle` and `worktree-toolkit-init` (removed non-skill `model`/`tools` fields, added trigger phrasing).
- Created `scripts/sync-skill-distro.sh` (`--check` / `--apply`) to sync designs into agent-skill-distro.
- Ran the sync and the distro's update-skills refresh. OKF skill installed in `~/.codex/skills`, `~/.claude/skills`, `~/.agents/skills`, `~/.pi/agent/skills`, and `pi-extensions/skills`.

### 2026-07-13 Governance Update

- Defined the designs-versus-distro ownership boundary in `templates/instructional-documents/skill-governance.md`.
- Adopted T1 development, T2 sprint checkpoint, T3 Dev UAT, T4 QA application readiness, and T5 release verification stages.
- Recorded deterministic distro auditing, reversible quarantine, and CI enforcement as distribution-layer responsibilities.
- Clarified that Dev UAT accepts changed sprint or epic functionality in Dev while full end-to-end regression belongs to QA application readiness.

## What Was Deprecated

- The forked `~/.codex/skills/vibe-fix` copy (backed up to `~/.skill-root-backups/`, replaced with a managed symlink).
- The divergent `pi-extensions` OKF SKILL.md (replaced by the canonical copy via the distro's workspace-projects source).
- Full duplicate bodies in `commands/plan-review.md` and `commands/release-assess.md` (now thin pointers).

## Lessons Learned

- Skills without YAML frontmatter never trigger in CLI harnesses; the OKF skill had been undeployable since creation.
- The distro's `rsync --delete` on managed roots silently reverts direct edits to live copies; always write to the distro source tree, not the live root.
- Three-layer distribution drifts without an automated check; `sync-skill-distro.sh --check` now provides it.
- Treating designs as the source for every distro-native policy file creates a second form of drift. Ownership must be explicit per asset, not inferred from the word "skill."

## Alternatives Considered

- **Single-layer distribution (designs directly to CLI roots):** Rejected because it couples content ownership with distribution mechanics and doesn't scale to multiple CLI harnesses.
- **Commands as canonical over skills:** Rejected because commands lack the YAML frontmatter needed for auto-triggering and are not discoverable by CLI harnesses in the same way.
- **No sync script, manual copying:** Rejected because manual copying is error-prone and leads to drift, as demonstrated by the divergent vibe-fix and OKF skill copies.

## Related Concepts

- [Skill Distribution Sync](../process/skill-distribution-sync.md) - The process for running the sync script
- [OKF System Current State](../state/current-state.md) - Current deployment status
