---
type: Architecture
title: OKF Installer Design
description: How install-okf.sh deploys the knowledge directory, viewer, query helper, hook, curator droid, and AGENTS.md section
resource: ./templates/okf/install-okf.sh
tags: [okf, installer, bash, deployment, setup]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# OKF Installer Design

`install-okf.sh` is a bash script that deploys the OKF knowledge bundle into a target project. It is run once per project to create the initial structure and install the post-commit hook.

## Usage

```bash
bash install-okf.sh <target-project-path>
```

The script uses `set -euo pipefail` for strict error handling.

## Step 1: Create Knowledge Directory Structure

The script creates a `knowledge/` directory with subdirectories: `inbox/`, `inbox/processed/`, `architecture/`, `components/`, `domain/`, `decisions/`, `process/`, `deprecation/`, `state/`.

If `knowledge/` already exists, the script warns and skips directory creation, preserving existing concepts.

Template index files are copied from `templates/` if available. The root `index.md` is generated with `sed` substitution for `{{PROJECT_NAME}}` (set to the target directory basename) and `{{DATE}}` (set to the current UTC date). If no templates directory exists, minimal index files are created inline.

## Step 2: Install Viewer, Generator, and Query Helper

`viewer.html` and `generate-viz.js` are copied from the script directory into `knowledge/`. The user is told to run `node knowledge/generate-viz.js knowledge/` to generate the self-contained `viz.html`. The `okf-query.sh` portable concept search tool is also copied to `knowledge/okf-query.sh` and made executable. See [OKF Query Helper](./okf-query-helper.md).

## Step 2b: Install Curator Droid

The `okf-curator.md` agent contract is copied to `.factory/droids/` in the target project. If a `.claude/` directory exists, it is also copied to `.claude/agents/`. See [Curation Audit and Nudge](../decisions/curation-audit-and-nudge.md).

## Step 3: Legacy Documentation Detection

If the target project has a `docs/` directory with markdown files, the script prints guidance about legacy alignment mode: existing docs stay in place, OKF concepts reference them via the `resource` field, and a legacy scan should be run to create reference concepts. See [Legacy Alignment Mode](../decisions/legacy-alignment-mode.md).

## Step 4: Install Post-Commit Hook

The hook is installed to `.githooks/post-commit` in the project root:

1. Create `.githooks/` directory if it does not exist.
2. If an existing `post-commit` hook is found, back it up to `post-commit.bak`.
3. Copy `post-commit.sh` to `.githooks/post-commit`.
4. `chmod +x` the hook to make it executable.
5. Set **local** `core.hooksPath` to `.githooks` via `git -C "$TARGET" config core.hooksPath .githooks`.

Using local (not global) `core.hooksPath` is deliberate: it prevents conflicts with other projects that may have different hook configurations. If the target is not yet a git repo, the script advises running `git config core.hooksPath .githooks` after `git init`.

See [Hook System](./hook-system.md) for the hook's behaviour.

## Step 5: Update AGENTS.md

The script appends the OKF Knowledge Bundle section from `AGENTS-OKF-SECTION.md` to the project's `AGENTS.md`:

- If `AGENTS.md` exists and already contains "OKF Knowledge Bundle", it is skipped.
- If `AGENTS.md` exists without the OKF section, the section is appended with a separator.
- If `AGENTS.md` does not exist, it is created with the OKF section as its content.

See [Migrate AGENTS.md](../process/migrate-agents-md.md) for the full migration process.

## Post-Install Guidance

The script prints next steps: commit the `knowledge/` directory, ensure the post-commit hook is active, agents should read `knowledge/index.md` before work, write session syntheses to `knowledge/inbox/` before committing, and run curation (okf-curator droid) when the hook nudges at 5+ unprocessed inbox items or after any significant epic closes.

## Relationship to Deployment Runbook

The installer handles Phase 1 (Mechanical Install) of the [deployment workflow](../process/deploy-okf.md). The remaining phases (seeding, epic processing, schema diagrams, AGENTS.md migration, curation, viewer generation, verification) are performed by agents following the runbook.
