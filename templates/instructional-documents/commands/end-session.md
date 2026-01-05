---
description: Close out the current coding session with review, docs update, and push
---

You are closing out the current development session. **YOU MUST complete ALL steps below. Do not skip any step.**

---

## Step 1: Run Quality Checks

**ACTION REQUIRED:** Execute these commands:

```bash
pnpm lint
pnpm build
```

If any errors occur, fix them before proceeding to Step 2.

---

## Step 2: Code Review

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

## Step 3: Update Implementation Checklist & Handle Incomplete Items

**ACTION REQUIRED - THIS IS MANDATORY:**

### 3.1 Mark Completed Tasks

1. Read `features/00-IMPLEMENTATION-CHECKLIST.md`
2. Identify which tasks were completed during this session
3. **Use the Edit tool** to change `- [ ]` to `- [x]` for each completed task

Example edit:
```
OLD: - [ ] TipTap integration with StarterKit
NEW: - [x] TipTap integration with StarterKit
```

### 3.2 Check for Incomplete Sprint Items

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

### 3.3 If user chooses BACKLOG (option 1):

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
5. Continue to Step 4

### 3.4 If user chooses CONTINUE IMPLEMENTATION (option 2):

**STOP the end-session workflow.** Inform the user:

> "Returning to implementation mode. Use `/next-phase` or continue working on the remaining tasks:
> - [List remaining tasks]
>
> Run `/end-session` again when ready to close out."

**Do not proceed further. Exit the end-session workflow.**

### 3.5 If ALL sprint items are complete:

No action needed. Proceed to Step 4.

**Do not proceed to Step 4 until the checklist has been updated and any incomplete items have been handled.**

---

## Step 4: Update Session Log

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

**Do not proceed to Step 5 until the session log has been updated.**

---

## Step 5: Update AGENTS.md (if applicable)

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

## Step 6: Git Operations

**ACTION REQUIRED:** Execute these commands in order:

### 6.1 Check for remote

First, check if origin remote exists:
```bash
git remote -v
```

### 6.2 If origin EXISTS, fetch and rebase:

```bash
git fetch origin master || git fetch origin main
git rebase origin/master || git rebase origin/main
```

If rebase conflicts occur, resolve them before continuing.

### 6.3 If NO origin remote:

Skip fetch/rebase steps. Inform the user:
> "No origin remote configured. Skipping fetch/rebase. To add a remote later: `git remote add origin <repo-url>`"

### 6.4 Stage all changes:

```bash
git add .
```

### 6.5 Check if there are changes to commit:

```bash
git status --porcelain
```

If no output (nothing to commit), skip to Step 7.

### 6.6 Commit with descriptive message:

```bash
git commit -m "feat(sprint-X): [description of completed work]"
```

### 6.7 Push to origin (only if remote exists):

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

## Step 7: Summary

**ACTION REQUIRED:** Provide a summary that includes:

1. **Completed work**: List what was accomplished
2. **Checklist items marked**: Confirm which items were checked off
3. **Files updated**: Confirm checklist and session log were edited
4. **Issues resolved**: Any code review findings that were fixed
5. **Next steps**: What should be done in the next session

---

**BEGIN NOW: Start with Step 1 - Run Quality Checks.**
