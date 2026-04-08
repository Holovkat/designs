# GitHub Workflow Guide

> ## ⚠️ MANDATORY REQUIREMENTS
>
> | Rule           | Requirement                                              |
> | -------------- | -------------------------------------------------------- |
> | **Merge Type** | **ALWAYS use squash merge** — no exceptions              |
> | **Rebasing**   | **MUST rebase regularly** — keep stack in sync with main |
> | **PR Size**    | Small, focused — ONE logical change per PR               |
> | **Tooling**    | Use `gh pr merge --squash --delete-branch`               |
>
> **Violation of these rules is not acceptable. All PRs that do not follow this workflow will be rejected.**

## Overview

This project **MUST ALWAYS** use the **Graphite stacking workflow** — a method that allows you to create chains of dependent pull requests (PRs). This guide shows how to replicate this workflow using GitHub and Git commands.

## Core Concepts

### What is Stacking?

Stacking means building multiple small, focused PRs on top of each other, where each PR depends on the previous one. This allows you to:

- Break large features into reviewable chunks
- Get faster feedback on individual changes
- Continue working while waiting for reviews
- Merge PRs independently as they're approved

### Traditional vs. Stacking Workflow

**Traditional:**

```
main ← feature-branch (one large PR)
```

**Stacking:**

```
main ← PR1 ← PR2 ← PR3 (chain of small PRs)
```

---

## Setting Up Your Workflow

### 1. Initial Repository Setup

```bash
# Clone your repository
git clone <repository-url>
cd <repository-name>

# Fetch latest changes
git fetch origin
```

### 2. Configure Git for Better Stacking

```bash
# Set up automatic branch tracking
git config --global push.default current
git config --global pull.rebase true

# Optional: Set up aliases for common operations
git config --global alias.sync '!git fetch origin && git rebase origin/main'
git config --global alias.update-branch '!git fetch origin && git rebase origin/$(git rev-parse --abbrev-ref HEAD)'
```

---

## Creating a Stack

### Step 1: Create Your First Branch

```bash
# Start from remote main
git fetch origin
git checkout -b feature/part-1-setup origin/main
```

Make your changes and commit:

```bash
git add .
git commit -m "feat: add initial setup"
git push origin feature/part-1-setup
```

Create a PR on GitHub targeting `main`.

### Step 2: Stack the Second Branch

**Important:** Start from your previous branch, not main!

```bash
# Create second branch FROM the first
git checkout -b feature/part-2-implementation
```

Make your changes and commit:

```bash
git add .
git commit -m "feat: implement core functionality"
git push origin feature/part-2-implementation
```

Create a PR on GitHub targeting `feature/part-1-setup` (not main).

### Step 3: Continue Stacking

```bash
# Create third branch FROM the second
git checkout -b feature/part-3-tests
```

Make changes, commit, and push:

```bash
git add .
git commit -m "test: add comprehensive tests"
git push origin feature/part-3-tests
```

Create a PR on GitHub targeting `feature/part-2-implementation`.

---

## Managing Your Stack

### Viewing Your Stack

```bash
# See all branches
git branch -vv

# See commit history
git log --oneline --graph --all
```

### Making Changes to a Middle Branch

If you need to update `feature/part-1-setup` after creating the stack:

```bash
# Make changes to first branch
git checkout feature/part-1-setup
# ... make your changes ...
git add .
git commit -m "fix: address review feedback"
git push --force-with-lease

# Rebase all dependent branches
git checkout feature/part-2-implementation
git rebase feature/part-1-setup
git push --force-with-lease

git checkout feature/part-3-tests
git rebase feature/part-2-implementation
git push --force-with-lease
```

---

## Merging Your Stack (Squash Merge - Required)

**CRITICAL:** All merges MUST use **squash merge**. This is mandatory, not optional. Squash merging:

- Creates a single atomic commit per PR
- Prevents intermediate broken states during merge
- Keeps the running dev server stable (no transient errors)
- Results in cleaner git history on main

### Using GitHub CLI (Recommended)

```bash
# Squash merge via GitHub CLI - simplest method
gh pr merge <PR_NUMBER> --squash --delete-branch

# Then pull the changes locally
git checkout main
git pull origin main
```

### Manual Worktree Method (Alternative)

If you need more control over the merge process:

#### Step 1: Create Merge Worktree

```bash
# Create a dedicated worktree for merge operations (one-time setup)
git worktree add ../fms-glm-merge main

# Navigate to the merge worktree
cd ../fms-glm-merge
```

#### Step 2: Perform the Squash Merge

```bash
# Ensure you're on latest main
git fetch origin
git checkout main
git pull origin main

# Squash merge - all commits become one atomic commit
git merge --squash origin/feature/part-1-setup
git commit -m "feat: description of feature (#PR_NUMBER)"
```

#### Step 3: Verify Before Pushing (Required)

**All checks MUST pass before pushing to origin/main:**

```bash
# Install dependencies (if needed after merge)
npm install

# Run linting
npm run lint

# Run type checking (if applicable)
npm run typecheck  # or: npx tsc --noEmit

# Run build to ensure no build errors
npm run build
```

**If ANY step fails:**

```bash
# Abort the merge and investigate
git reset --hard origin/main

# Return to main workspace to fix issues
cd ../fms-glm
```

Do NOT push to origin/main until all checks pass.

#### Step 4: Push to Remote Main

**Only after ALL verification passes:**

```bash
# Push the verified merge to origin/main
git push origin main
```

### Updating Remaining Stack

After successful push, update remaining branches in your main workspace:

```bash
# Return to main working directory
cd ../fms-glm

# Fetch the updated main
git fetch origin

# Rebase the next branch onto updated main
git checkout feature/part-2-implementation
git rebase origin/main
git push --force-with-lease

# Change the PR base branch to main on GitHub
gh pr edit <pr-number> --base main
```

Repeat Steps 2-5 for each subsequent PR in the stack.

### Worktree Cleanup

```bash
# Remove the worktree when done with merge operations
git worktree remove ../fms-glm-merge

# Or list worktrees to see what exists
git worktree list
```

---

## Best Practices

### 1. Keep PRs Small and Focused

- Each PR should represent one logical change
- Aim for PRs that take < 30 minutes to review
- Use descriptive commit messages

### 2. Name Branches Clearly

```bash
feature/1-database-schema
feature/2-api-endpoints
feature/3-frontend-integration
```

### 3. Write Clear PR Descriptions

Include in each PR description:

```markdown
## Part X of Y: [Feature Name]

### This PR

- What this specific PR does

### Stack Context

- Previous: #123 (Database schema)
- Next: #125 (Frontend integration)

### Testing

- How to test this change
```

### 4. Use Draft PRs

Mark PRs as draft until the previous PR in the stack is merged:

```bash
# Create draft PR via GitHub CLI
gh pr create --draft --base feature/part-1-setup --title "Part 2: Implementation"
```

### 5. Keep Stack Height Manageable

- Limit stacks to 3-5 PRs
- Longer stacks become harder to manage
- Consider parallel stacks instead

---

## Handling Conflicts

### When Rebasing Fails

```bash
# During rebase, if conflicts occur
git status  # See conflicting files

# Fix conflicts in your editor
git add <resolved-files>
git rebase --continue

# If you need to start over
git rebase --abort
```

### When Force Push is Rejected

```bash
# Use --force-with-lease for safety
git push --force-with-lease

# If still rejected, sync first
git fetch origin
git rebase origin/<branch-name>
git push --force-with-lease
```

---

## GitHub CLI Integration

Install GitHub CLI for easier PR management:

```bash
# Install gh
# macOS: brew install gh
# Linux: See https://cli.github.com/

# Authenticate
gh auth login

# Create PRs quickly
gh pr create --base main --title "Part 1: Setup"
gh pr create --base feature/part-1-setup --title "Part 2: Implementation"

# View PRs in stack
gh pr list --author @me

# Check PR status
gh pr status
```

---

## Automation Scripts

### Auto-rebase Script

Create `rebase-stack.sh`:

```bash
#!/bin/bash
# Usage: ./rebase-stack.sh branch1 branch2 branch3

BASE="main"

for BRANCH in "$@"; do
    echo "Rebasing $BRANCH onto $BASE..."
    git checkout "$BRANCH"
    git rebase "$BASE" || exit 1
    git push --force-with-lease || exit 1
    BASE="$BRANCH"
done

echo "Stack rebased successfully!"
```

### Sync All Branches Script

Create `sync-stack.sh`:

```bash
#!/bin/bash
# Syncs entire stack with main

git fetch origin

for BRANCH in "$@"; do
    echo "Syncing $BRANCH..."
    git checkout "$BRANCH"
    git rebase origin/main
    git push --force-with-lease
done
```

---

## Troubleshooting

### "Your branch has diverged"

```bash
# Check what's different
git log HEAD..origin/<branch-name>
git log origin/<branch-name>..HEAD

# If local is correct
git push --force-with-lease

# If remote is correct
git reset --hard origin/<branch-name>
```

### Lost Commits After Rebase

```bash
# Use reflog to recover
git reflog
git checkout <commit-hash>
git checkout -b recovery-branch
```

### Circular Dependencies

If you accidentally create circular dependencies:

```bash
# Reset to main
git fetch origin

# Recreate branches in correct order
git checkout -b feature/part-1-fixed origin/main
git cherry-pick <commit-hash>
```

---

## Summary

The Graphite-style workflow on GitHub:

1. **Create stacked branches** - each branch builds on the previous
2. **Open PRs targeting parent branch** - not main
3. **Rebase frequently** - keep stack in sync with main
4. **Squash merge bottom-up** - use `gh pr merge --squash` for atomic commits
5. **Update targets** - change PR base to main after parent merges

**Why squash merge?** Each PR becomes a single atomic commit on main. This prevents intermediate broken states when merging (no transient errors in running dev servers) and keeps git history clean.

This workflow enables faster iteration and better code review while maintaining a clean git history.
