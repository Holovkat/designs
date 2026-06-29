---
type: Process
title: Install Session Workflows
description: Installer script for refreshing commands, hooks, scripts, skills, and worktree guidance into another project
resource: ./templates/instructional-documents/install-session-workflows.sh
tags: [designs, installer, session, workflows, commands, hooks, skills, scripts]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Install Session Workflows

## Overview

The `install-session-workflows.sh` script refreshes commands, scripts, skills, hooks, and worktree guidance in an existing project. Safe to run multiple times, overwriting existing files with latest template versions.

## Usage

```bash
./install-session-workflows.sh [OPTIONS]
```

### Options

| Option | Description |
|--------|-------------|
| `--commands-only` | Only install commands + scripts/skills/worktrees, skip hooks |
| `--hooks-only` | Only install hooks, skip commands + scripts/skills/worktrees |
| `--no-settings` | Skip copying settings.json |
| `--with-templates` | Also install design templates |
| `--dry-run` | Show what would be copied without copying |
| `--help` | Show help message |

### Environment Overrides

- `DESIGNS_WORKFLOW_SOURCE` - Source template directory when refreshing from a project copy
- `WORKFLOW_COMMANDS_DIR` - Target command directory (default: `./commands`)
- `WORKFLOW_HOOKS_DIR` - Target hook directory (default: `./hooks`)
- `WORKFLOW_SETTINGS_FILE` - Target settings file (default: `./settings.json`)

## What Gets Installed

### Commands
Slash command templates from `commands/`:
- `/plan-feature`, `/plan-bugfix`, `/plan-github`, `/plan-review`
- `/compliance-review`, `/uat`
- `/end-session`, `/join-session`, `/next-phase`
- `/release-assess`, `/kingmode`

### Scripts
Shell scripts from `scripts/`:
- `release-vector-assess.sh` - Release vector assessment
- `start-droid-worktree.sh` - Droid worktree management
- `worktree-session-*.sh` - Worktree session lifecycle (open, close, prepare, cleanup, lib)

### Skills
Project-local skills from `skills/`:
- `worktree-toolkit-init` - Session tooling audit/update
- `worktree-session-lifecycle` - Operational session flow
- `plan-review` - Planning artifact review
- `release-assess` - Release intent/confidence routing
- `vibe-fix` - Small pragmatic behavior fix

### Hooks
Git hooks from `hooks/`:
- `pre-commit-workflow.sh` - Pre-commit validation
- `post-commit-push.sh` - Post-commit push
- `post-edit-lint.sh` - Post-edit linting
- `code-review-checkpoint.sh` - Code review checkpoint
- `pre-completion-build.sh` - Pre-completion build check
- `batch-lint-check.sh` - Batch lint check
- `sanity-check.sh` - Sanity check

### Worktrees
Worktree guidance from `worktrees/`:
- `AGENTS.md` - Worktree area agent instructions
- `README.md` - Worktree guidance overview
- `_meta/` - Metadata

### Settings
- `settings.json` - Basic settings
- `settings-agent-aware.json` - Agent-aware settings

## Source Detection

The script auto-detects whether it is running from the template source (has `commands/` and `hooks/` subdirectories) or from a project's command directory. When running from a project, it sources from `DESIGNS_WORKFLOW_SOURCE` or `$HOME/workspace/designs/templates/instructional-documents`.

## Related Concepts

- [Templates Architecture](../architecture/templates-architecture.md)
- [Planning Decomposition](./planning-decomposition.md)
- [Delivery Lifecycle](./delivery-lifecycle.md)
- [Workflow Guide](./workflow-guide.md)
- [GitHub Workflow Guide](./github-workflow.md)
