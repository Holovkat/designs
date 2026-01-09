---
description: Close out the current coding session with compliance review, docs update, and push
---

You are closing out the current development session. **YOU MUST complete ALL steps below. Do not skip any step.**

**IMPORTANT**: This workflow includes a MANDATORY compliance review gate. The session cannot complete until the implementation meets all specification requirements or the user explicitly waives compliance.

---

## Step 1: Run Quality Checks

**ACTION REQUIRED:** Execute these commands:

```bash
pnpm lint
pnpm build
```

If any errors occur, fix them before proceeding to Step 2.

---

## Step 2: Compliance Review (MANDATORY GATE)

**ACTION REQUIRED:** Run the compliance review to verify implementation meets spec requirements.

### 2.1 Identify Current Phase

1. Read `features/00-IMPLEMENTATION-CHECKLIST.md`
2. Identify the current sprint/phase being worked on
3. Find the corresponding shard document (e.g., `features/phase-2-menus.md`)

### 2.2 Extract and Verify Requirements

1. Read the phase shard document completely
2. Extract ALL acceptance criteria and deliverables
3. Verify EACH requirement:
   - Check file/component existence
   - Verify props interfaces match spec
   - Confirm required functionality is implemented
   - Run type check: `pnpm tsc --noEmit`
   - Run sanity check: verify app loads without errors

### 2.3 Generate Compliance Report

Create a compliance report:

```markdown
## Compliance Report: Phase [X] - [Name]

**Total Requirements**: [N]
**Passed**: [N] ✅ | **Failed**: [N] ❌

### Results
| Requirement | Status | Notes |
|-------------|--------|-------|
| [Requirement] | ✅/❌ | [Details] |

**Overall Status**: PASS/FAIL
```

### 2.4 Handle Compliance Result

**If ALL requirements PASS:**
- Log: "✅ Compliance verified - proceeding with session close"
- Continue to Step 3

**If ANY requirements FAIL:**

**DO NOT PROCEED.** Ask the user:

> "❌ Compliance review found [N] unmet requirements:
> 1. [Failed requirement 1]
> 2. [Failed requirement 2]
>
> Options:
> 1. **Fix and retry** - Analyze gaps with /kingmode, create remediation shards, implement fixes, re-verify
> 2. **Waive compliance** - Proceed despite gaps (adds to BACKLOG with 'Compliance Gap' tag)
> 3. **Review details** - Discuss each failure before deciding
>
> Reply 1, 2, or 3."

**If user chooses FIX (option 1):**
1. Run `/kingmode` to analyze gaps deeply
2. Create remediation shard if needed: `features/phase-X-remediation.md`
3. Update implementation checklist with remediation tasks
4. Get user approval on remediation plan
5. Implement fixes
6. **LOOP BACK to Step 2.2** - Re-run compliance review
7. Repeat until PASS or user waives

**If user chooses WAIVE (option 2):**
1. Add failed items to `features/BACKLOG.md` with "Compliance Gap" tag
2. Log waiver in session log
3. Continue to Step 3

**If user chooses REVIEW (option 3):**
1. Present detailed compliance report
2. Discuss each failure
3. Re-ask options 1 or 2

---

## Step 3: Code Review

**ACTION REQUIRED:** Use the built-in `/review` command:

1. Run `/review` and select **"Review uncommitted changes"**
2. Review all findings, paying attention to:
   - **[P0]** Critical issues - MUST fix before proceeding
   - **[P1]** Urgent issues - Should fix before proceeding
   - **[P2]** Normal issues - Fix if time permits
   - **[P3]** Nice-to-have - Optional improvements
3. **Fix any P0 and P1 issues** before proceeding
4. Optionally fix P2/P3 issues

If `/review` is not available, manually review with `git diff` for:
- Security issues (exposed secrets, SQL injection, XSS)
- Performance concerns
- Missing error handling
- Code style violations
- Missing types

---

## Step 4: Update Implementation Checklist & Handle Incomplete Items

**ACTION REQUIRED - THIS IS MANDATORY:**

### 4.1 Mark Completed Tasks

1. Read `features/00-IMPLEMENTATION-CHECKLIST.md`
2. Identify which tasks were completed during this session
3. **Use the Edit tool** to change `- [ ]` to `- [x]` for each completed task

Example edit:
```
OLD: - [ ] TipTap integration with StarterKit
NEW: - [x] TipTap integration with StarterKit
```

### 4.2 Check for Incomplete Sprint Items

After marking completed items, check if there are **remaining incomplete items** (`- [ ]`) in the current sprint.

**If there ARE incomplete items in the current sprint, ASK the user:**

> "The current sprint has incomplete items:
> - [List each incomplete item]
>
> Would you like to:
> 1. **Move to backlog** - These items will be added to `features/BACKLOG.md` for future planning and the sprint can be considered complete
> 2. **Continue implementation** - Return to implementation mode to complete these items
>
> Reply '1' to backlog items, or '2' to continue implementing."

### 4.3 If user chooses BACKLOG (option 1):

1. Read `features/BACKLOG.md`
2. **Use the Edit tool** to add the incomplete items to the backlog

Add this format for each item:
```markdown
### [Sprint X] - [Task Name]

**Original Sprint**: Sprint X - [Name]
**Moved Date**: [TODAY'S DATE]
**Reason**: Deferred to complete sprint milestone
**Priority**: [Assess based on task importance]
**Dependencies**: [Any blockers or prerequisites]

**Task Details**:
- [ ] [Original task description]
- [ ] [Any subtasks]

**Reference**: [Link to original feature doc from checklist]
```

3. **Use the Edit tool** to REMOVE the backlogged items from the checklist (delete the `- [ ]` lines)
4. Add a note to the sprint section indicating items were backlogged:
   ```
   **Backlogged Items**: See `features/BACKLOG.md` for deferred tasks
   ```
5. Continue to Step 5

### 4.4 If user chooses CONTINUE IMPLEMENTATION (option 2):

**STOP the end-session workflow.** Inform the user:

> "Returning to implementation mode. Use `/next-phase` or continue working on the remaining tasks:
> - [List remaining tasks]
>
> Run `/end-session` again when ready to close out."

**Do not proceed further. Exit the end-session workflow.**

### 4.5 If ALL sprint items are complete:

No action needed. Proceed to Step 5.

**Do not proceed to Step 5 until the checklist has been updated and any incomplete items have been handled.**

---

## Step 5: Update Session Log

**ACTION REQUIRED - THIS IS MANDATORY:**

1. Read `changelog/SESSION-LOG.md`
2. **Use the Edit tool** to add a new session entry at the bottom of the file

Add this format (fill in the actual values):

```markdown
### Session: [TODAY'S DATE] - [BRANCH NAME]

**Sprint**: [Sprint number and name from checklist]
**Branch**: `[current git branch]`

#### Completed Tasks
- [x] [List each task completed, copied from checklist]

#### Files Changed
- `[path/to/file]` - [Brief description of change]

#### Code Review Notes
- [Any issues found and fixed, or "No issues found"]

#### Next Steps
- [What remains to be done, or "Sprint complete"]
```

**Do not proceed to Step 6 until the session log has been updated.**

---

## Step 6: Update AGENTS.md (if applicable)

**ACTION REQUIRED if any of these are true:**
- New components or patterns were added
- New key files were created that agents should reference
- New commands or conventions were established

If applicable, **use the Edit tool** to update the relevant AGENTS.md file:
- Add new entries to the JIT Index section
- Keep entries lightweight (file path + brief description)
- Reference detailed docs rather than inline documentation

If no updates needed, explicitly state: "No AGENTS.md updates required for this session."

---

## Step 7: Git Operations

**ACTION REQUIRED:** Execute these commands in order:

### 7.1 Check for remote

First, check if origin remote exists:
```bash
git remote -v
```

### 7.2 If origin EXISTS, fetch and rebase:

```bash
git fetch origin master || git fetch origin main
git rebase origin/master || git rebase origin/main
```

If rebase conflicts occur, resolve them before continuing.

### 7.3 If NO origin remote:

Skip fetch/rebase steps. Inform the user:
> "No origin remote configured. Skipping fetch/rebase. To add a remote later: `git remote add origin <repo-url>`"

### 7.4 Stage all changes:

```bash
git add .
```

### 7.5 Check if there are changes to commit:

```bash
git status --porcelain
```

If no output (nothing to commit), skip to Step 8.

### 7.6 Commit with descriptive message:

```bash
git commit -m "feat(sprint-X): [description of completed work]"
```

### 7.7 Push to origin (only if remote exists):

If origin remote exists:
```bash
git push --force-with-lease origin $(git rev-parse --abbrev-ref HEAD)
```

If push fails with "no upstream branch", use:
```bash
git push -u origin $(git rev-parse --abbrev-ref HEAD)
```

If no origin remote, inform the user:
> "Changes committed locally. No remote configured - push skipped."

---

## Step 8: Close GitHub Issues (If Applicable)

**ACTION REQUIRED:** Check if the completed sprint has linked GitHub issues that should be closed.

### 8.1 Check for GitHub References

Review the sprint section in `features/00-IMPLEMENTATION-CHECKLIST.md` for GitHub references:

Look for lines like:
```
**GitHub**: Issue #42
**GitHub**: PR #15
```

Or task items like:
```
- [x] Close GitHub issue #42
```

### 8.2 Verify Sprint Completion

**Only close GitHub issues if:**
- ALL tasks in the sprint are marked complete (`- [x]`)
- Compliance review PASSED (not waived)
- Code has been committed and pushed

### 8.3 Close the GitHub Issue

**If a GitHub issue is linked and sprint is complete:**

```bash
# Check gh CLI is available
gh --version

# Close the issue with a completion comment
gh issue close [NUMBER] --comment "## Completed

This issue has been implemented and merged.

**Sprint**: Sprint [N] - [Name]
**Branch**: \`[branch-name]\`
**Commit**: [commit-hash]

**Completed Tasks**:
- [x] [Task 1]
- [x] [Task 2]
- [x] [Task 3]

_Closed via /end-session on [DATE]_"
```

**For PRs that should be merged:**

> "This sprint includes PR #[number]. The PR should be merged via GitHub's merge process.
>
> Would you like me to merge it now? (Reply 'yes' to merge, 'no' to skip)"

If yes:
```bash
gh pr merge [NUMBER] --squash --delete-branch
```

### 8.4 Confirm Closure

> "Closed GitHub issue #[number] with completion comment."

Or if no GitHub references:

> "No GitHub issues linked to this sprint. Skipping GitHub closure."

### 8.5 Handle Partial Completion

**If sprint has GitHub reference but tasks are incomplete:**

> "Sprint has linked GitHub issue #[number], but not all tasks are complete. The issue will remain open.
>
> Incomplete tasks:
> - [ ] [Task 1]
> - [ ] [Task 2]
>
> The issue will be closed when all tasks are complete in a future session."

---

## Step 9: Summary

**ACTION REQUIRED:** Provide a summary that includes:

1. **Compliance status**: PASSED or WAIVED (with reason)
2. **Completed work**: List what was accomplished
3. **Checklist items marked**: Confirm which items were checked off
4. **Files updated**: Confirm checklist and session log were edited
5. **Issues resolved**: Any code review findings that were fixed
6. **Remediation rounds**: How many fix/retry loops were needed (if any)
7. **GitHub status**: Issue/PR closed, or "No linked GitHub issues", or "Issue remains open (incomplete)"
8. **Next steps**: What should be done in the next session

---

**Session is now ready for UAT (User Acceptance Testing) if compliance passed.**

---

**BEGIN NOW: Start with Step 1 - Run Quality Checks.**
