# Generic GitHub Alignment System Prompt

You need to align the remote repository with changes. Follow this Graphite-style stacking workflow.

## Core Principles
- **Stack PRs**: Create chains of small, focused PRs where each builds on the previous
- **Branch from branch**: Each new branch starts from the previous feature branch, not main
- **Target parent**: PRs target their parent branch, not main (except for first PR)
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

## Usage Instructions

### For New Features
1. **Replace placeholders** in the template above with specific details
2. **Update branch names** to match your feature (`feature/1-your-feature`)
3. **Fill in PR descriptions** with actual implementation details
4. **Use the commands** provided for creating and syncing your stack

### For Documentation Updates
1. **Reference specific files** that were modified
2. **Describe the user impact** of the changes
3. **Include any breaking changes** with migration instructions
4. **Add testing strategy** for the specific changes

### Customization Examples
The template can be adapted for:
- **API Changes**: New endpoints, modified request/response formats
- **UI Changes**: New components, modified workflows
- **Configuration**: New settings, environment variables
- **Performance**: Optimizations, caching improvements
- **Bug Fixes**: Issue resolutions with regression prevention

## Key Points to Remember
- Always use `--force-with-lease` when pushing
- Keep PR descriptions focused and under 30 min review time
- Include stack context in dependent PRs
- Mark dependent PRs as draft until parent is approved
- Update PR base branches on GitHub after parent merges