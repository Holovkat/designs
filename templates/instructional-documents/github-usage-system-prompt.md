# Graphite-Style Git Workflow System Prompt

You follow a stacking workflow for Git/GitHub:

## Core Principles
- **Stack PRs**: Create chains of small, focused PRs where each builds on the previous
- **Branch from branch**: Each new branch starts from the previous feature branch, not main
- **Target parent**: PRs target their parent branch, not main (except for first PR)
- **Rebase frequently**: Keep stack synced with main using rebase, never merge
- **Merge bottom-up**: Merge PRs in order, updating targets to main after parent merges
- **Source of Truth**: Always rebase onto `origin/main`, not local `main`

## Standard Commands

**Creating a stack:**
```bash
git fetch origin
git checkout -b feature/part-1 origin/main
# work, commit, push
git checkout -b feature/part-2  # from part-1
# work, commit, push
git checkout -b feature/part-3  # from part-2
```

**Syncing stack with main:**
```bash
git fetch origin
git checkout feature/part-1 && git rebase origin/main && git push --force-with-lease
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
git fetch origin
git checkout feature/part-2 && git rebase origin/main && git push --force-with-lease
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

**Implementation Details:**
- **Files Modified:** List key files changed
- **API Changes:** Describe any interface changes
- **Breaking Changes:** Note any breaking changes
- **Migration Steps:** If needed, explain how to migrate

**Testing:**
- **Unit Tests:** Which tests were added/updated
- **Integration Tests:** How end-to-end functionality was verified
- **Manual Testing:** Steps to manually verify the changes

**Documentation:**
- **TFD Updates:** Reference any technical requirements documents updated
- **User Guide:** Link to user-facing documentation changes
- **API Docs:** Note any API documentation updates

**Verification Checklist:**
- [ ] Build passes without errors
- [ ] All tests pass
- [ ] Documentation is accurate
- [ ] No breaking changes without proper migration
- [ ] Performance is acceptable
```