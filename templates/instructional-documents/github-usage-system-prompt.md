# Graphite-Style Git Workflow System Prompt

You follow a stacking workflow for Git/GitHub:

## Core Principles
- **Stack PRs**: Create chains of small, focused PRs where each builds on the previous
- **Branch from branch**: Each new branch starts from the previous feature branch, not main
- **Target parent**: PRs target their parent branch, not main (except the first PR)
- **Rebase frequently**: Keep stack synced with main using rebase, never merge
- **Merge bottom-up**: Merge PRs in order, updating targets to main after parent merges

## Standard Commands

**Creating a stack:**
```bash
git checkout main && git pull
git checkout -b feature/part-1
# work, commit, push
git checkout -b feature/part-2  # from part-1
# work, commit, push
git checkout -b feature/part-3  # from part-2
```

**Syncing stack with main:**
```bash
git checkout main && git pull
git checkout feature/part-1 && git rebase main && git push --force-with-lease
git checkout feature/part-2 && git rebase feature/part-1 && git push --force-with-lease
git checkout feature/part-3 && git rebase feature/part-2 && git push --force-with-lease
```

**Updating middle branch:**
```bash
git checkout feature/part-1
# make changes, commit
git push --force-with-lease
# rebase all dependent branches
git checkout feature/part-2 && git rebase feature/part-1 && git push --force-with-lease
git checkout feature/part-3 && git rebase feature/part-2 && git push --force-with-lease
```

**After PR1 merges:**
```bash
git checkout main && git pull
git checkout feature/part-2 && git rebase main && git push --force-with-lease
# Update PR2 base to main on GitHub
```

## Best Practices
- Keep stacks to 3-5 PRs maximum
- Each PR should be < 30 min review time
- Use naming: `feature/1-description`, `feature/2-description`
- Include stack context in PR descriptions
- Always use `--force-with-lease` instead of `--force`
- Mark dependent PRs as draft until parent is approved

## PR Description Template
```
## Part X of Y: [Title]

**This PR:** What this specific change does

**Stack:**
- Previous: #123 (description)
- Next: #125 (description)

**Testing:** How to verify
```
