---
type: Process
title: Skill Distribution Sync
description: Three-layer workflow for syncing canonical workflow skills from designs to agent-skill-distro to installed CLI skill roots
resource: ./scripts/sync-skill-distro.sh
tags: [skills, distribution, sync, agent-skill-distro, cli-roots, canonical, workflow]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# Skill Distribution Sync

The designs repo is the canonical source for workflow skills. `scripts/sync-skill-distro.sh` syncs skills from designs into the `agent-skill-distro` repo, which then distributes them to installed CLI skill roots. See [Workflow Skill Canonicalisation](../decisions/skill-canonicalisation.md) for the decision rationale.

## Three-Layer Model

```
designs (source of truth)
  -> agent-skill-distro (distribution layer)
    -> ~/.codex/skills, ~/.claude/skills, ~/.agents/skills, ~/.pi/agent/skills (installed roots)
```

- **Layer 1 (designs):** Skills are authored and edited here. This is the only place to make content changes.
- **Layer 2 (agent-skill-distro):** The distro repo receives synced files from designs and handles distribution to CLI roots via its own bootstrap/update scripts. The OKF skill goes into `shared/skills/okf` with per-target symlinks.
- **Layer 3 (installed CLI roots):** The live skill directories that CLI harnesses (Claude, Codex, Pi, etc.) read from. These are managed by the distro's rsync and should never be edited directly.

## Usage

```bash
# Check for drift between designs, distro, and pi-extensions source
scripts/sync-skill-distro.sh --check

# Apply sync (copies designs skills to distro and pi-extensions source)
scripts/sync-skill-distro.sh --apply
```

After running `--apply`, run the distro's `update-skills` refresh to propagate to installed CLI roots.

## What the Script Syncs

- Project skills from `templates/instructional-documents/skills/` to the distro.
- The OKF skill to `shared/skills/okf` in the distro and to the managed `workspace-projects/pi-extensions/skills/okf` source.
- The okf-curator agent contract to `pi-extensions/.factory/droids/` as a full per-harness copy.

## Drift Detection

`--check` mode compares the designs source against the distro and pi-extensions copies. If everything matches, it reports "In sync". If there is drift, it reports which files differ so they can be synced with `--apply`.

## Guard: rsync --delete

The distro's rsync uses `--delete` on managed roots, which means direct edits to live copies (e.g., editing `~/.codex/skills/vibe-fix/SKILL.md` directly) are silently reverted on the next refresh. Always edit in the designs source and sync, never in the live root.

## Related Concepts

- [Workflow Skill Canonicalisation](../decisions/skill-canonicalisation.md) - The decision establishing designs as canonical source
- [OKF System Current State](../state/current-state.md) - Current deployment status
- [Install Session Workflows](./install-session-workflows.md) - Related installer for session workflow assets
