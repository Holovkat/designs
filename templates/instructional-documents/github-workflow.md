# GitHub Workflow Guide

## Overview

Introduces a **stacking workflow** that allows you to create chains of dependent pull requests (PRs). This guide shows how to replicate this workflow using GitHub and Git commands.

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

### Syncing with Main

When `origin/main` is updated, rebase your entire stack:

```bash
# Update knowledge of remote
git fetch origin

# Rebase first branch
git checkout feature/part-1-setup
git rebase origin/main
git push --force-with-lease

# Rebase second branch onto first
git checkout feature/part-2-implementation
git rebase feature/part-1-setup
git push --force-with-lease

# Rebase third branch onto second
git checkout feature/part-3-tests
git rebase feature/part-2-implementation
git push --force-with-lease
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

## Merging Your Stack

### Option 1: Merge in Order (Recommended)

Merge PRs from bottom to top:

1. Merge `feature/part-1-setup` → `main`
2. Update PR2 to target `main`:
   ```bash
   git fetch origin
   git checkout feature/part-2-implementation
   git rebase origin/main
   git push --force-with-lease
   ```
   Change the base branch on GitHub PR to `main`
3. Merge `feature/part-2-implementation` → `main`
4. Repeat for remaining branches

### Option 2: Squash Merge Strategy

If your team uses squash merging:

```bash
# After PR1 is merged
git fetch origin

# Rebase PR2 onto updated main
git checkout feature/part-2-implementation
git rebase origin/main
# Resolve conflicts if any
git push --force-with-lease

# Update PR target to main on GitHub
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
4. **Merge bottom-up** - merge PRs in order
5. **Update targets** - change PR base to main after parent merges

This workflow enables faster iteration and better code review while maintaining a clean git history.
