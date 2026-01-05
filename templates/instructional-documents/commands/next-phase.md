---
description: Continue implementing the next phase from the project checklist
---

You are starting or resuming work on the next implementation phase. **Follow these steps in order.**

---

## Step 1: Check for Uncommitted Changes

**ACTION REQUIRED - THIS STEP IS CRITICAL:**

First, check if there are any uncommitted changes:

```bash
git status --porcelain
```

### If there ARE uncommitted changes:

**STOP and ask the user:**

> "You have uncommitted changes from your previous session. Before proceeding to the next phase, we need to close out the current session properly.
>
> Would you like me to run `/end-session` now to:
> 1. Run lint and build
> 2. Perform code review
> 3. Update the implementation checklist
> 4. Update session log
> 5. Commit and push changes
>
> Reply 'yes' to run end-session, or 'no' to skip (not recommended)."

**If user says YES:**
- Execute the full `/end-session` workflow (all 7 steps from that command)
- After `/end-session` completes successfully, continue to Step 2 below

**If user says NO:**
- Warn: "Proceeding without committing. Your changes may be lost or cause conflicts."
- Continue to Step 2

### If there are NO uncommitted changes:

Proceed directly to Step 2.

---

## Step 2: Read the Implementation Checklist

**ACTION REQUIRED:** Read `features/00-IMPLEMENTATION-CHECKLIST.md` and identify:

1. The first sprint/phase that has unchecked items (`- [ ]`)
2. Whether that sprint already has a **Branch** field assigned

---

## Step 3: Determine Branch Status

**Check for existing branch in the checklist.**

Look for a line like this under the sprint header:
```
**Branch**: `feature/sprint-X-description`
```

### 3.1 First, check current branch:

```bash
git branch --show-current
```

### 3.2 If the NEXT sprint's branch EXISTS in checklist:

1. Check if already on the correct branch. If so, proceed to Step 4.

2. Check if the branch exists locally:
   ```bash
   git branch --list "<branch-name>"
   ```

3. If branch EXISTS locally (output is not empty), switch to it:
   ```bash
   git checkout <branch-name>
   ```

4. If branch does NOT exist locally (output is empty), create it:
   ```bash
   git checkout -b <branch-name-from-checklist>
   ```

5. Proceed to Step 4.

### 3.3 If NO branch in checklist for the next sprint:

1. Generate branch name from sprint: `feature/sprint-X-short-description`
   - Example: `feature/sprint-2-block-system`

2. Check if the branch already exists locally:
   ```bash
   git branch --list "feature/sprint-X-short-description"
   ```

3. If branch EXISTS (output is not empty), switch to it:
   ```bash
   git checkout feature/sprint-X-short-description
   ```
   
4. If branch does NOT exist (output is empty), create it:
   ```bash
   git checkout -b feature/sprint-X-short-description
   ```

5. **ACTION REQUIRED - Use the Edit tool** to add the branch to the checklist.
   
   Add this line immediately after the sprint Goal line:
   ```
   **Branch**: `feature/sprint-X-short-description`
   ```
   
   Example - change this:
   ```markdown
   ## Sprint 2: Block System
   **Goal**: Full block-based editing experience
   
   ### Epic: Block Interactions
   ```
   
   To this:
   ```markdown
   ## Sprint 2: Block System
   **Goal**: Full block-based editing experience
   **Branch**: `feature/sprint-2-block-system`
   
   ### Epic: Block Interactions
   ```

6. Confirm the edit was made by reading the file again.

---

## Step 4: Read Feature Documentation

**ACTION REQUIRED:** Read the referenced feature document for this sprint.

Look for links like `[12-BLOCK-SYSTEM.md](./12-BLOCK-SYSTEM.md)` in the checklist and read that file to understand the implementation requirements.

---

## Step 5: Present Implementation Plan

**ACTION REQUIRED:** Show the user:

1. **Sprint/Phase**: Which sprint you're working on
2. **Branch**: The branch name (existing or newly created)
3. **Remaining Tasks**: List all unchecked items (`- [ ]`) for this sprint
4. **Implementation Plan**: Brief approach for each task
5. **Feature Doc Summary**: Key requirements from the feature document

Then ask: **"Ready to proceed with implementation?"**

---

## Step 6: Implement Tasks

**After user confirmation**, implement each task:

1. Work through tasks in order
2. After completing each task, **use the Edit tool** to mark it complete:
   ```
   OLD: - [ ] Task description
   NEW: - [x] Task description
   ```
3. Continue until all tasks are complete or user requests to stop

---

## Step 7: Session Summary

When stopping (either all tasks complete or user requests pause):

1. List completed tasks
2. List remaining tasks (if any)
3. Remind user to run `/end-session` to close out properly

---

**BEGIN NOW: Start with Step 1 - Check for Uncommitted Changes.**
