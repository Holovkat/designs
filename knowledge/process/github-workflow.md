---
type: Process
title: GitHub Workflow Guide
description: Graphite-style stacking workflow with squash merge, branch chaining, and force-with-lease rebasing
resource: ./templates/instructional-documents/github-workflow.md
tags: [designs, github, workflow, graphite, stacking, squash-merge, git]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# GitHub Workflow Guide

## Mandatory Requirements

| Rule | Requirement |
|------|-------------|
| Merge Type | ALWAYS use squash merge, no exceptions |
| Rebasing | MUST rebase regularly to keep stack in sync with main |
| PR Size | Small, focused, ONE logical change per PR |
| Tooling | Use `gh pr merge --squash --delete-branch` |

## Core Concept: Stacking

Stacking means building chains of small, focused PRs where each depends on the previous:

```
main <- PR1 <- PR2 <- PR3 (chain of small PRs)
```

This allows breaking large features into reviewable chunks, faster feedback, continuing work while waiting for reviews, and independent merging as PRs are approved.

## Creating a Stack

1. Create first branch from `origin/main`
2. Each subsequent branch starts from the previous branch, not main
3. PRs target their parent branch (not main), except the first PR targets main

## Managing the Stack

- View stack: `git branch -vv`, `git log --oneline --graph --all`
- Update middle branch: commit, push `--force-with-lease`, then rebase all dependent branches
- Use `--force-with-lease` instead of `--force` for safety

## Squash Merge (Required)

Squash merging creates a single atomic commit per PR, prevents intermediate broken states, keeps the dev server stable, and results in cleaner git history.

```bash
gh pr merge <PR_NUMBER> --squash --delete-branch
git checkout main
git pull origin main
```

## After Bottom PR Merges

1. Fetch updated main
2. Rebase next branch onto `origin/main`
3. Push `--force-with-lease`
4. Change PR base to main on GitHub: `gh pr edit <pr-number> --base main`

## Best Practices

- Keep PRs small (< 30 min review time)
- Name branches clearly: `feature/1-database-schema`, `feature/2-api-endpoints`
- Include stack context in PR descriptions (Previous, Next PR numbers)
- Use draft PRs until parent is approved
- Limit stacks to 3-5 PRs

## PR Description Template

Include: Part X of Y, This PR, Stack Context (Previous/Next), Implementation Details (files, API changes, breaking changes), Testing (unit, integration, manual), Documentation updates, Verification Checklist.

## Automation Scripts

- `rebase-stack.sh` - Rebase entire stack onto a base branch
- `sync-stack.sh` - Sync all branches with `origin/main`

## Troubleshooting

- Diverged branch: check logs, force-with-lease if local is correct
- Lost commits after rebase: use `git reflog` to recover
- Circular dependencies: reset to main and recreate branches in correct order

## Related Concepts

- [Graphite Stacking for Docs](../decisions/graphite-stacking-for-docs.md)
- [Deployment Guide](./deployment-guide.md)
- [Planning Decomposition](./planning-decomposition.md)
- [Delivery Lifecycle](./delivery-lifecycle.md)
- [GitHub Usage System Prompt](https://github.com/holovkat/designs/blob/main/templates/instructional-documents/github-usage-system-prompt.md)
