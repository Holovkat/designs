---
description: Interactive planning session to scope and document a bug fix
---

You are conducting an **interactive planning session** to scope a bug fix. This process will interview the user, analyze the codebase, and produce a focused remediation specification.

**CRITICAL RULES:**
1. **ONE QUESTION AT A TIME** - Never ask multiple questions in a single response
2. **WAIT FOR ANSWERS** - Do not proceed until the user responds
3. **INTERVIEW MODE** - This is a conversation, not a checklist dump
4. **FOCUS ON ROOT CAUSE** - Bug fixes require understanding the cause, not just symptoms
5. **COMPLETE ALL MANDATORY STEPS** - You MUST complete the interview, investigation, AND artifact creation. Do NOT stop after analysis.

---

## MANDATORY WORKFLOW OVERVIEW

| Step | Description | Required? |
|------|-------------|-----------|
| 1 | Context Gathering | **MANDATORY** |
| 2 | Initiate Interview | **MANDATORY** |
| 3 | Interview Questions | **MANDATORY** |
| 4 | Root Cause Investigation | **MANDATORY** |
| 5 | Present Findings | **MANDATORY** |
| 6 | Determine Fix Placement | **MANDATORY** |
| 7 | Generate Bugfix Shard | **MANDATORY** |
| 8 | Update Implementation Checklist | **MANDATORY** |
| 9 | Planning Summary | **MANDATORY** |

**DO NOT STOP after Step 5.** After presenting findings, you MUST proceed to create the shard document (Step 7) and update the checklist (Step 8).

---

## Step 1: Context Gathering

**ACTION REQUIRED:** Before engaging the user, silently gather context about the project.

### 1.1 Review Project Documentation

Read these files if they exist (do not report errors if missing):

```bash
# Core documentation
cat AGENTS.md 2>/dev/null || cat .factory/AGENTS.md 2>/dev/null
cat CLAUDE.md 2>/dev/null
cat README.md 2>/dev/null
```

### 1.2 Check Implementation Status

```bash
# Current implementation state
cat features/00-IMPLEMENTATION-CHECKLIST.md 2>/dev/null
cat features/BACKLOG.md 2>/dev/null
ls features/*.md 2>/dev/null
```

### 1.3 Review Recent Git Activity

```bash
# Recent changes - bugs often introduced recently
git log --oneline -20
git log --oneline --since="7 days ago"
git status
git branch --show-current
```

### 1.4 Identify Tech Stack

```bash
# Determine project type and dependencies
cat package.json 2>/dev/null | head -50
ls -la src/ 2>/dev/null || ls -la app/ 2>/dev/null || ls -la lib/ 2>/dev/null
```

**Store this context internally. Do not output it to the user yet.**

---

## Step 2: Initiate Interview

**ACTION REQUIRED:** Begin the interview. If the user provided an initial prompt, acknowledge it and start clarifying. If not, ask the opening question.

### 2.1 Opening (if no initial prompt provided)

> "Let's document this bug fix properly. I'll ask you some questions one at a time to understand the issue.
>
> **What bug or issue are you experiencing?**
>
> Describe what's happening - error messages, unexpected behavior, etc."

### 2.2 Opening (if initial prompt WAS provided)

> "I see you're dealing with: [summarize their bug description in 1-2 sentences]
>
> Let me ask some clarifying questions to fully understand this issue.
>
> **[First clarifying question based on what's unclear or missing]**"

---

## Step 3: Interview Questions

**INTERVIEW PROTOCOL:**
- Ask ONE question, wait for response
- Acknowledge their answer briefly before the next question
- Adapt questions based on their responses
- Skip questions that have already been answered
- Build toward root cause identification

### 3.1 SYMPTOM - What's Happening

Ask these (one at a time, as needed):

1. "What exactly is the incorrect behavior? What do you see?"
2. "What error messages appear (if any)? Console errors, UI errors, etc."
3. "Can you reproduce this consistently, or is it intermittent?"
4. "What are the exact steps to reproduce the bug?"

### 3.2 EXPECTED - What Should Happen

Ask these (one at a time, as needed):

1. "What is the expected/correct behavior?"
2. "Was this working before? If so, when did it stop working?"

### 3.3 CONTEXT - Environment & Conditions

Ask these (one at a time, as needed):

1. "Does this happen in all environments (dev, staging, prod) or specific ones?"
2. "Does it affect all users or specific conditions (browser, device, user role)?"
3. "Are there any recent changes that might be related? (deployments, config changes)"

### 3.4 IMPACT - Severity Assessment

Ask these (one at a time, as needed):

1. "How severe is this? (Blocks all users / Affects some users / Minor annoyance)"
2. "Is there a workaround users can use in the meantime?"

### 3.5 SUSPICIONS - User Insights

Ask this if the user seems technical:

1. "Do you have any suspicions about what might be causing this?"

---

## Step 4: Root Cause Investigation

**ACTION REQUIRED:** Based on the interview, investigate the codebase.

### 4.1 Inform the User

> "Let me investigate the codebase to identify the likely root cause..."

### 4.2 Search for Related Code

Based on the bug description, search for relevant files:

```bash
# Search for related components/functions mentioned
rg "[keyword from bug]" --type [ts/tsx/js/py] -l
rg "[error message text]" -l
```

### 4.3 Check Recent Changes to Related Files

```bash
# If specific files are implicated
git log --oneline -10 -- [suspected-file-path]
git diff HEAD~10 -- [suspected-file-path]
```

### 4.4 Review Suspected Code

Read the files most likely to contain the bug.

### 4.5 Identify Root Cause

Form a hypothesis about:
- **What** is broken (specific code/logic)
- **Why** it's broken (logic error, missing check, race condition, etc.)
- **Where** the fix should be applied

---

## Step 5: Present Findings

**ACTION REQUIRED:** Share your analysis with the user.

> "Based on my investigation:
>
> **Likely Root Cause:**
> [Explain what you found - be specific about files and code]
>
> **Why This Causes the Bug:**
> [Explain the mechanism - why does this code produce the symptom]
>
> **Proposed Fix:**
> [High-level description of the fix approach]
>
> **Files to Modify:**
> - `[file1.ts]` - [what change]
> - `[file2.ts]` - [what change]
>
> **Confidence Level:** [High/Medium/Low]
>
> **Does this analysis seem correct? Should I proceed with creating the fix specification?**"

**Wait for user confirmation.**

**IMPORTANT: Once user confirms (or after any corrections), you MUST proceed to Step 6 to create artifacts. Do NOT stop here.**

### 5.1 If User Disagrees or Has More Info

> "Thanks for that clarification. Let me re-investigate with this new information..."

Return to Step 4 with the new context.

### 5.2 If Root Cause is Unclear

> "I couldn't definitively identify the root cause. Let me do a deeper analysis..."

**Trigger `/kingmode` for complex bugs:**

```markdown
/kingmode

Debug this issue:

## Bug Summary
[Symptom description]

## Reproduction Steps
[Steps from interview]

## Expected vs Actual
- Expected: [what should happen]
- Actual: [what happens]

## Investigation So Far
[What you've checked]

## Questions to Answer:
1. What code paths are involved in this flow?
2. Where could the logic be failing?
3. What edge cases might not be handled?
4. Are there race conditions or timing issues?
5. Could this be a state management issue?
6. Are there any recent changes that correlate?
```

---

## Step 6: Determine Fix Placement (MANDATORY)

**ACTION REQUIRED - THIS STEP IS MANDATORY.** Decide how to track this fix.

### 6.1 Read Current Checklist

```bash
cat features/00-IMPLEMENTATION-CHECKLIST.md 2>/dev/null
```

### 6.2 Assess Fix Scope

**Simple Fix (1-2 files, clear solution):**
- Can be added to existing sprint if one is in progress
- Or create a small "Bugfix" sprint

**Complex Fix (multiple files, architectural implications):**
- Should be its own sprint with proper phases

### 6.3 Handle Existing Sprints

**If there's an active sprint with incomplete items, ask:**

> "There's an active sprint in progress:
>
> **[Sprint X: Name]**
> - [ ] [Incomplete item 1]
>
> For this bug fix, would you like to:
> 1. **Add to current sprint** - Include as a task in Sprint [X]
> 2. **Create bugfix sprint** - Add as a separate Sprint [N+1]: Bugfix
>
> Reply 1 or 2."

**If no active sprint:**

Create a new bugfix sprint.

---

## Step 7: Generate Bugfix Shard Document (MANDATORY)

**ACTION REQUIRED - THIS STEP IS MANDATORY.** You MUST create the bug fix specification document. Do NOT skip this step.

### 7.1 Determine Shard Number and Filename

```bash
ls features/*.md 2>/dev/null | grep -E '^features/[0-9]+-' | sort -n | tail -1
```

**Naming convention:** `[NN]-bugfix-[short-description].md`
- Example: `05-bugfix-login-timeout.md`, `06-bugfix-cart-calculation.md`

### 7.2 Create the Shard Document

**Use the Create tool** to create `features/[NN]-bugfix-[description].md`:

```markdown
# Bugfix: [Short Description] - Specification

## Document Metadata
- **Bug ID**: BUG-[generated or provided]
- **Sprint**: Sprint [N] - Bugfix: [Description]
- **Created**: [TODAY'S DATE]
- **Status**: Planning Complete
- **Severity**: [Critical/High/Medium/Low]
- **Priority**: [P0/P1/P2/P3]

---

## 1. Bug Summary

### 1.1 Symptom
[What the user experiences - the visible problem]

### 1.2 Expected Behavior
[What should happen instead]

### 1.3 Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Observe: bug manifests]

### 1.4 Environment
- **Browsers Affected**: [All / Chrome / Firefox / etc.]
- **Environments**: [Dev / Staging / Prod]
- **User Conditions**: [All users / Specific role / Specific state]

### 1.5 Severity Assessment
- **User Impact**: [Description of impact]
- **Workaround Available**: [Yes/No - describe if yes]
- **Users Affected**: [All / Subset / Edge case]

---

## 2. Root Cause Analysis

### 2.1 Root Cause
[Clear explanation of what's causing the bug]

### 2.2 Affected Code
| File | Line(s) | Issue |
|------|---------|-------|
| `[file-path]` | [~line numbers] | [What's wrong] |

### 2.3 Why This Causes the Bug
[Technical explanation of how the code defect produces the symptom]

### 2.4 When This Was Introduced
- **Likely Commit**: [commit hash if identified]
- **Approximate Date**: [when it started]
- **Related Change**: [what change might have caused it]

---

## 3. Proposed Fix

### 3.1 Fix Strategy
[High-level approach to fixing the bug]

### 3.2 Code Changes Required

#### File: `[path/to/file1.ts]`
**Current (Buggy):**
```typescript
// Describe or show the problematic code
```

**Fixed:**
```typescript
// Describe or show the corrected code
```

**Rationale:** [Why this change fixes the issue]

#### File: `[path/to/file2.ts]` (if applicable)
[Repeat pattern above]

### 3.3 Additional Changes
- [ ] [Any other changes needed - tests, types, etc.]

---

## 4. Testing Requirements

### 4.1 Reproduction Test
Before fixing, confirm the bug:
- [ ] Follow reproduction steps
- [ ] Observe expected bug behavior
- [ ] Document exact error/symptom

### 4.2 Fix Verification
After fixing:
- [ ] Follow same reproduction steps
- [ ] Confirm bug no longer occurs
- [ ] Verify expected behavior works

### 4.3 Regression Testing
Ensure fix doesn't break other things:
- [ ] [Related feature 1] still works
- [ ] [Related feature 2] still works
- [ ] Run existing test suite: `pnpm test`

### 4.4 Edge Cases to Test
- [ ] [Edge case 1]
- [ ] [Edge case 2]

---

## 5. Implementation Checklist

### Phase 1: Verify & Fix
- [ ] Reproduce the bug locally
- [ ] Implement the fix in `[file1]`
- [ ] Implement the fix in `[file2]` (if applicable)
- [ ] Verify bug is resolved

### Phase 2: Test & Validate
- [ ] Run reproduction steps - confirm fix
- [ ] Run regression tests
- [ ] Test edge cases
- [ ] Run lint and type check

### Phase 3: Complete
- [ ] Code review
- [ ] Update any affected documentation
- [ ] Commit with descriptive message

---

## 6. Acceptance Criteria

- [ ] Bug no longer reproducible via documented steps
- [ ] Expected behavior works correctly
- [ ] No regression in related features
- [ ] All tests pass
- [ ] No new lint/type errors
- [ ] Build succeeds

---

## 7. Rollback Plan

If the fix causes issues:

1. **Revert Commit**: `git revert [commit-hash]`
2. **Notify**: [Who to notify]
3. **Workaround**: [Temporary workaround for users]

---

## 8. References

- **Error Logs**: [Link or paste relevant logs]
- **Related Issues**: [Links to related bugs/tickets]
- **Related Code**: [Links to relevant source files]

---

*Generated by /plan-bugfix on [TODAY'S DATE]*
```

---

## Step 8: Update Implementation Checklist (MANDATORY)

**ACTION REQUIRED - THIS STEP IS MANDATORY.** You MUST update the implementation checklist. Do NOT skip this step.

### 8.1 Read Current Checklist

```bash
cat features/00-IMPLEMENTATION-CHECKLIST.md
```

### 8.2 Edit the Checklist

**Use the Edit tool** to add the bugfix sprint/tasks:

**If adding as new sprint:**
```markdown
---

## Sprint [N]: Bugfix - [Short Description]
**Goal**: Fix [bug description]
**Shard**: [`[NN]-bugfix-[description].md`](./[NN]-bugfix-[description].md)
**Severity**: [Critical/High/Medium/Low]

### Bugfix Tasks
- [ ] Reproduce and verify bug
- [ ] Implement fix in [file(s)]
- [ ] Test fix resolves issue
- [ ] Regression testing
- [ ] Code review and merge
```

**If adding to existing sprint:**
```markdown
### Bugfix: [Short Description]
- [ ] Fix: [Bug description] - See [`[NN]-bugfix-[description].md`](./[NN]-bugfix-[description].md)
```

### 8.3 Verify the Edit

Read the file again to confirm changes.

---

## Step 9: Planning Summary (MANDATORY)

**ACTION REQUIRED - THIS STEP IS MANDATORY.** Present the final summary confirming what was created.

```markdown
## ✅ Bugfix Planning Complete

### Bug Summary
- **Issue**: [One-line description]
- **Severity**: [Critical/High/Medium/Low]
- **Root Cause**: [Brief root cause]

### Documents Created
- **Shard**: `features/[NN]-bugfix-[description].md`
- **Checklist Updated**: `features/00-IMPLEMENTATION-CHECKLIST.md`

### Fix Overview
**Files to Modify:**
1. `[file1.ts]` - [change summary]
2. `[file2.ts]` - [change summary]

**Estimated Complexity**: [Simple/Medium/Complex]

### Implementation Tasks
1. [ ] Reproduce bug locally
2. [ ] Implement fix
3. [ ] Verify fix works
4. [ ] Regression testing
5. [ ] Code review

### Next Steps
To begin the fix, run:
```
/start-session bugfix/[short-description]
```

Or if continuing existing work:
```
/next-phase
```

### Files to Reference
- `features/[NN]-bugfix-[description].md` - Full bug analysis and fix spec
- `features/00-IMPLEMENTATION-CHECKLIST.md` - Task tracking
```

---

## Handling Edge Cases

### If user wants to cancel mid-interview:

> "No problem. Planning session cancelled. No documents were created.
>
> Run `/plan-bugfix` again when you're ready."

### If bug can't be reproduced:

> "I couldn't reproduce this bug with the information provided. Let's gather more details:
>
> **Can you provide any of the following?**
> - Console logs or error stack traces
> - Screenshots or screen recording
> - Specific data/state that triggers the bug
> - Browser developer tools output"

### If root cause truly can't be determined:

Create a shard with "Investigation Required" status and tasks for deeper debugging:

```markdown
## 3. Investigation Required

Root cause not yet identified. The following investigation is needed:

### Investigation Tasks
- [ ] Add logging to [suspected area]
- [ ] Review [related system] behavior
- [ ] Test with different [conditions]
- [ ] Check [external dependency] status
```

### If checklist doesn't exist:

Create it with the bugfix as Sprint 1.

### If features/ directory doesn't exist:

```bash
mkdir -p features
```

Then create both the checklist and shard.

---

**BEGIN NOW:** 
1. Start with Step 1 - Context Gathering (silently)
2. Proceed to Steps 2-3 - Interview the user about the bug
3. Execute Step 4 - Investigate root cause
4. Present findings in Step 5
5. **THEN YOU MUST** proceed to Steps 6-8 to create the shard document and update the checklist
6. Finally, present the summary in Step 9

**The planning session is NOT complete until the shard document exists and the checklist is updated.**
