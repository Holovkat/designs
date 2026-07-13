---
type: Process
title: Skill Distribution Sync
description: Ownership-aware workflow for syncing mapped designs assets into agent-skill-distro and validating distro policy before refreshing installed roots
resource: ./scripts/sync-skill-distro.sh
tags: [skills, distribution, sync, agent-skill-distro, cli-roots, canonical, workflow]
timestamp: 2026-07-13T03:35:53Z
status: active
---

# Skill Distribution Sync

The designs repo is the canonical source for reusable workflow assets explicitly mapped by `scripts/sync-skill-distro.sh`. The `agent-skill-distro` repo owns distribution policy, runtime adapters, deterministic auditing, quarantine, and CI before refreshing installed roots. See [Workflow Skill Canonicalisation](../decisions/skill-canonicalisation.md) and `templates/instructional-documents/skill-governance.md`.

## Three-Layer Model

```
designs (source of truth)
  -> agent-skill-distro (distribution layer)
    -> ~/.codex/skills, ~/.claude/skills, ~/.agents/skills, ~/.pi/agent/skills (installed roots)
```

- **Layer 1 (designs):** Reusable skills and workflow documents mapped by the sync script are authored here.
- **Layer 2 (agent-skill-distro):** The distro receives mapped content and owns all distribution-native policy, runtime overlays, quarantine manifests, strict auditing, and CI. The OKF skill goes into `shared/skills/okf` with per-target symlinks.
- **Layer 3 (installed CLI roots):** The live skill directories that CLI harnesses (Claude, Codex, Pi, etc.) read from. These are managed by the distro's rsync and should never be edited directly.

## Usage

```bash
# Check for drift between designs, distro, and pi-extensions source
scripts/sync-skill-distro.sh --check

# Apply sync (copies designs skills to distro and pi-extensions source)
scripts/sync-skill-distro.sh --apply
```

After running `--apply`, run the distro's `update-skills` refresh to propagate to installed CLI roots.

Before applying, review the reported destinations. The sync is not authority to overwrite unrelated distro-native changes or a dirty target file without reconciliation.

## What the Script Syncs

- Project skills from `templates/instructional-documents/skills/` to the distro.
- The OKF skill to `shared/skills/okf` in the distro and to the managed `workspace-projects/pi-extensions/skills/okf` source.
- The okf-curator agent contract to `pi-extensions/.factory/droids/` as a full per-harness copy.

## Drift Detection

`--check` mode compares the designs source against the distro and pi-extensions copies. If everything matches, it reports "In sync". If there is drift, it reports which files differ so they can be synced with `--apply`.

## Distro Validation

After reconciling mapped content in the distro, run:

```bash
python3 scripts/audit-skills.py --strict
python3 -m unittest scripts.tests.test_audit_skills -v
bash scripts/update-skills.sh
```

The strict audit covers metadata, descriptions, runtime-local duplicate names, broken or untracked links, untracked active skills, quarantine enforcement, size and package-shape rules, and blocked machine-local plugins. Hosted CI runs the same repository checks with `--skip-codex-config` because it cannot inspect local plugin state.

## Guard: rsync --delete

The distro's rsync uses `--delete` on managed roots, which means direct edits to live copies (e.g., editing `~/.codex/skills/vibe-fix/SKILL.md` directly) are silently reverted on the next refresh. Always edit in the designs source and sync, never in the live root.

For distro-native audit policy, runtime adapters, quarantine records, or CI, edit `agent-skill-distro` directly rather than creating a duplicate designs copy.

## Related Concepts

- [Workflow Skill Canonicalisation](../decisions/skill-canonicalisation.md) - The decision establishing designs as canonical source
- [OKF System Current State](../state/current-state.md) - Current deployment status
- [Install Session Workflows](./install-session-workflows.md) - Related installer for session workflow assets
