---
type: Architecture
title: OKF Offline Installer Design
description: Idempotent file-copy installer for the bundle, bounded tools including an inert scheduler adapter, controls, hooks, viewer, and contracts
resource: ./templates/okf/install-okf.sh
tags: [bash, deployment, installer, offline, okf, setup]
timestamp: 2026-08-08T13:18:09Z
status: active
issue_refs: [26]
epic_refs: [26]
assertion_state: proposed
generated_at: 2026-08-08T00:00:00Z
generated_by: epic-26-implementation
source_authority: repository-source
evidence_refs: [templates/okf/install-okf.sh, templates/okf/tests/runtime-vendor_test.mjs]
---

# Installed surfaces

`install-okf.sh <target-root>` creates a missing knowledge structure while
preserving existing concepts; copies the viewer/generator and portable Bash
query fallback; installs the quality-aware post-commit hook and chained
predecessor; installs curator contracts; and copies the pinned YAML runtime,
schema/generated validator, accepted `.okf/lib` modules, `.okf/bin` commands,
and curation prompt template.

The command surface covers lint, status, semantic query, run planning, bounded
curation/cancellation/resume, triage, reversible archive/rollback, manual
cadence status/observation, and an inert scheduled-curation adapter plus example
profile. Installed executables and canonical content are verified in a
throwaway repository fixture.

# Configuration preservation

Source defaults map to `.okf/profile.json`, `.okf/cadence.json`, and
`.okf/KILL_SWITCH` only when the destination is absent. Reinstall preserves
existing regular files, custom controls, and symlink presence rather than
silently replacing project-local policy.

# Runtime and side-effect boundary

Installation is file-copy/configuration work only. It does not run Node/npm,
invoke any installed command or hook, start curation/archive/cadence, fetch a
dependency, contact a network, install an enabled scheduled profile,
cron/launchd/service/queue/Factory state, or discover another project. The
semantic command fails closed when its pinned local runtime is unavailable;
portable basic search remains usable.

The installer stages the standard OKF section for review but never creates or
edits `AGENTS.md`. Later curation/migration/status operations only report
instruction alignment proposals and require separate approval to apply them.

# Hook preservation

The installer uses local `.githooks/`, chains a non-OKF predecessor as
`post-commit.pre-okf`, refuses an ambiguous collision, installs the canonical
hook, makes it executable, and sets repository-local `core.hooksPath`. It does
not use or change a global hook path.

# Related concepts

- [Deploy OKF to a Project](../process/deploy-okf.md)
- [Post-Commit Tier 1 Capture System](./hook-system.md)
- [OKF Parser Runtime Distribution](../decisions/okf-parser-runtime-distribution.md)
