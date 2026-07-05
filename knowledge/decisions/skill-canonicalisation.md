---
type: Decision
title: Workflow Skill Canonicalisation
description: Designs repo is the canonical source for workflow skills; SKILL.md is canonical over commands; three-layer distribution via agent-skill-distro
resource: ./scripts/sync-skill-distro.sh
tags: [skills, canonicalisation, distribution, agent-skill-distro, skill-md, commands, okf]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# Decision: Workflow Skill Canonicalisation

## Context

The designs repo contains project-local skills in `templates/instructional-documents/skills/` and workflow commands in `templates/instructional-documents/commands/`. Some skills and commands overlapped in purpose (e.g., `plan-review` skill and `commands/plan-review.md`), leading to duplication and drift. Skills were also distributed manually to CLI skill roots (`~/.codex/skills`, `~/.claude/skills`, etc.), which was error-prone and led to divergent copies.

A second issue: the OKF skill (`templates/instructional-documents/skills/okf/SKILL.md`) lacked YAML frontmatter (`name`, `description`, trigger phrases), which meant CLI harnesses could never auto-trigger it. It had been effectively undeployable since creation.

## Decision

1. **Designs repo is the canonical source** for all workflow skills. The `agent-skill-distro` repo syncs from designs and distributes to installed CLI skill roots.
2. **SKILL.md is canonical over command files.** Where a skill and a command cover the same workflow, the SKILL.md holds the full content and the command file is a thin pointer to the skill.
3. **Three-layer distribution model:** designs (source) -> agent-skill-distro (distribution) -> installed CLI skill roots (claude, codex, pi, agents). Each layer is kept in sync by `scripts/sync-skill-distro.sh`.
4. **The OKF skill is globally distributed** via the distro's `shared/skills/okf` with per-target symlinks.

## Rationale

- **Single source of truth:** With designs as canonical, there is one place to edit a skill. The distro handles the mechanics of copying to multiple CLI roots.
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

## What Was Deprecated

- The forked `~/.codex/skills/vibe-fix` copy (backed up to `~/.skill-root-backups/`, replaced with a managed symlink).
- The divergent `pi-extensions` OKF SKILL.md (replaced by the canonical copy via the distro's workspace-projects source).
- Full duplicate bodies in `commands/plan-review.md` and `commands/release-assess.md` (now thin pointers).

## Lessons Learned

- Skills without YAML frontmatter never trigger in CLI harnesses; the OKF skill had been undeployable since creation.
- The distro's `rsync --delete` on managed roots silently reverts direct edits to live copies; always write to the distro source tree, not the live root.
- Three-layer distribution drifts without an automated check; `sync-skill-distro.sh --check` now provides it.

## Alternatives Considered

- **Single-layer distribution (designs directly to CLI roots):** Rejected because it couples content ownership with distribution mechanics and doesn't scale to multiple CLI harnesses.
- **Commands as canonical over skills:** Rejected because commands lack the YAML frontmatter needed for auto-triggering and are not discoverable by CLI harnesses in the same way.
- **No sync script, manual copying:** Rejected because manual copying is error-prone and leads to drift, as demonstrated by the divergent vibe-fix and OKF skill copies.

## Related Concepts

- [Skill Distribution Sync](../process/skill-distribution-sync.md) - The process for running the sync script
- [OKF System Current State](../state/current-state.md) - Current deployment status
