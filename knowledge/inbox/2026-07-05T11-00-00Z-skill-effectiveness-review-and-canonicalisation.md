---
type: Inbox
title: Session 2026-07-05 - Skill effectiveness review and canonicalisation
description: Reviewed all project skills, fixed the OKF skill, de-duplicated commands vs skills, and made designs the canonical source with a sync script to agent-skill-distro
tags: [skills, okf, distribution, agent-skill-distro, workflow]
timestamp: 2026-07-05T11:00:00Z
branch: main
---

# What Was Done

- Effectiveness review of the 6 project skills in `templates/instructional-documents/skills/` plus the 12 workflow commands and the OKF system.
- Fixed the OKF skill: added YAML frontmatter (name, description, trigger phrases), added a `<designs>` repo-root resolution rule replacing machine-specific paths.
- De-duplicated plan-review and release-assess: SKILL.md is now canonical (merged the richer command content in); `commands/plan-review.md` and `commands/release-assess.md` are thin pointers to the skills.
- Enriched the vibe-fix description with trigger phrases from the drifted codex fork; the GitHub-issue-linked-to-epic behavior remains canonical.
- Normalized frontmatter on worktree-session-lifecycle and worktree-toolkit-init (removed non-skill `model`/`tools` fields, added trigger phrasing).
- Added `scripts/sync-skill-distro.sh` (--check / --apply) to sync designs into agent-skill-distro, including okf into `shared/skills/` and the managed `workspace-projects/pi-extensions/skills/okf` source.
- Ran the sync and the distro's update-skills refresh. OKF skill is now installed canonically in ~/.codex/skills, ~/.claude/skills, ~/.agents/skills, ~/.pi/agent/skills, and pi-extensions/skills.
- Committed the 21 previously pending workflow/OKF files as-is before this work.

# Decisions Made

- The designs repo is the canonical source for workflow skills; agent-skill-distro syncs from it and distributes to CLI skill roots.
- SKILL.md files are canonical; command files are thin pointers.
- The OKF skill is globally distributed via distro `shared/skills/okf` with per-target symlinks (claude, codex, pi).

# What Was Deprecated

- The forked ~/.codex/skills/vibe-fix copy (backed up to ~/.skill-root-backups/20260705-103520 by the distro tooling, replaced with a managed symlink).
- The divergent pi-extensions okf SKILL.md (replaced by the canonical copy via the distro's workspace-projects source).
- Full duplicate bodies in commands/plan-review.md and commands/release-assess.md.

# Lessons Learned

- Skills without YAML frontmatter never trigger in CLI harnesses; the OKF skill had been undeployable since creation.
- The distro's rsync --delete on managed roots silently reverts direct edits to live copies; always write to the distro source tree, not the live root.
- Three-layer distribution (designs -> distro -> installed roots) drifts without an automated check; `sync-skill-distro.sh --check` now provides it.

# Current State

- Drift check reports "In sync" across designs, distro, and pi-extensions source.
- agent-skill-distro and pi-extensions have uncommitted changes (synced files plus pre-existing in-flight work) awaiting the owner's commit.
- design-standard-v01/ remains an untracked nested git clone in designs, intentionally not committed.
