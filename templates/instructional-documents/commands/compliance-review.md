---
description: Verify implementation meets spec requirements before UAT
---

You are performing a **Compliance Review** to verify the implementation meets all requirements defined in the feature specifications (shards).

**THIS IS A BLOCKING GATE** - The session cannot end until compliance is achieved or explicitly waived by the user.

---

## Step 1: Identify Current Phase

**ACTION REQUIRED:**

1. Read `features/00-IMPLEMENTATION-CHECKLIST.md`
2. Identify the current sprint/phase being worked on
3. Find the corresponding shard document (e.g., `features/phase-2-menus.md`)

```bash
ls features/
```

---

## Step 2: Extract Acceptance Criteria

**ACTION REQUIRED:**

1. Read the phase shard document completely
2. Extract ALL acceptance criteria, deliverables, and requirements
3. Create a compliance checklist from:
   - **Deliverables** - Components/files that must exist
   - **Acceptance Criteria** - Functional requirements that must be met
   - **Implementation Details** - Specific patterns/APIs required
   - **Props/Interfaces** - Type definitions required
   - **Test Requirements** - Tests that must pass

Present the extracted requirements:

```markdown
## Compliance Checklist for Phase [X]: [Name]

### Deliverables
- [ ] [Component/file 1] - [location]
- [ ] [Component/file 2] - [location]

### Acceptance Criteria  
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Implementation Requirements
- [ ] [Specific pattern/API requirement]
- [ ] [Type definition requirement]

### Test Requirements
- [ ] [Test 1]
- [ ] [Test 2]
```

---

## Step 3: Verify Each Requirement

**ACTION REQUIRED:** For EACH item in the compliance checklist:

### 3.1 File/Component Existence
```bash
# Check if required files exist
ls -la src/components/[expected-path]/
```

### 3.2 Implementation Verification
Read each file and verify:
- Component implements required props interface
- Required functions/methods are present
- Expected behavior is implemented
- Code matches spec patterns

### 3.3 Functional Verification
If possible, verify functionality:
- Run the dev server: `pnpm dev`
- Check browser console for errors
- Verify component renders correctly

### 3.4 Type Check
```bash
pnpm tsc --noEmit
```

### 3.5 Lint Check
```bash
pnpm lint
```

### 3.6 Build Verification
```bash
pnpm build
```

---

## Step 4: Generate Compliance Report

**ACTION REQUIRED:** Create a detailed compliance report:

```markdown
# Compliance Report: Phase [X] - [Name]

**Date**: [TODAY]
**Reviewer**: Droid Compliance Agent
**Shard Document**: `features/phase-X-name.md`

## Summary
- **Total Requirements**: [N]
- **Passed**: [N] ✅
- **Failed**: [N] ❌
- **Partial**: [N] ⚠️

## Detailed Results

### Deliverables
| Item | Status | Notes |
|------|--------|-------|
| [Component] | ✅/❌/⚠️ | [Details] |

### Acceptance Criteria
| Criterion | Status | Evidence |
|-----------|--------|----------|
| [Criterion] | ✅/❌/⚠️ | [How verified] |

### Implementation Requirements
| Requirement | Status | Notes |
|-------------|--------|-------|
| [Requirement] | ✅/❌/⚠️ | [Details] |

## Failed Items Detail

### [Failed Item 1]
**Expected**: [What the spec requires]
**Actual**: [What was found]
**Gap**: [What's missing]

## Overall Status: [PASS/FAIL]
```

---

## Step 5: Handle Compliance Result

### If ALL requirements PASS:

```markdown
✅ **COMPLIANCE PASSED**

All requirements from `features/phase-X-name.md` have been verified.
The implementation is ready for integration.

Proceeding with `/end-session` workflow...
```

**Continue to Step 6 (proceed with end-session).**

---

### If ANY requirements FAIL:

```markdown
❌ **COMPLIANCE FAILED**

[N] requirements did not pass verification.

## Failed Requirements:
1. [Requirement 1] - [Brief reason]
2. [Requirement 2] - [Brief reason]

## Recommended Actions:
1. [Specific fix needed]
2. [Specific fix needed]
```

**DO NOT proceed with end-session. Instead:**

1. **Inform the user:**
   > "Compliance review found [N] unmet requirements. The implementation does not fully meet the phase specifications.
   >
   > Would you like to:
   > 1. **Fix and retry** - I'll analyze gaps, create additional shards if needed, and implement fixes
   > 2. **Waive compliance** - Proceed with end-session despite gaps (not recommended)
   > 3. **Review details** - Show full compliance report and discuss
   >
   > Reply 1, 2, or 3."

2. **If user chooses FIX AND RETRY (option 1):**
   - Proceed to Step 6A

3. **If user chooses WAIVE (option 2):**
   - Log the waiver in session log
   - Add failed items to BACKLOG.md with "Compliance Gap" tag
   - Continue with end-session

4. **If user chooses REVIEW (option 3):**
   - Present full compliance report
   - Discuss each failure
   - Then re-ask options 1 or 2

---

## Step 6A: Gap Analysis and Remediation Loop

**This step initiates an implementation loop until compliance is achieved.**

### 6A.1 Activate King Mode Analysis

Execute `/kingmode` for deep analysis:

```markdown
/kingmode

Analyze the compliance gaps for Phase [X]:

## Failed Requirements:
[List each failed requirement]

## Questions to Answer:
1. What is the root cause of each gap?
2. What specific code changes are needed?
3. Are there architectural issues to address?
4. What new shards/specs are needed?
5. What's the estimated effort to fix?
6. Are there dependencies or blockers?

## Analysis Scope:
- Review the shard document: `features/phase-X-name.md`
- Review the current implementation
- Identify exact files needing changes
- Determine if scope was underestimated
```

### 6A.2 Create Remediation Shards (if needed)

If the analysis reveals missing specifications:

1. Create a new shard document:
   ```
   features/phase-X-name-remediation.md
   ```

2. Include:
   - Specific gaps being addressed
   - Detailed implementation requirements
   - Code examples where helpful
   - Acceptance criteria for the fix

### 6A.3 Update Implementation Checklist

Edit `features/00-IMPLEMENTATION-CHECKLIST.md`:

```markdown
## Phase [X]: [Name] - REMEDIATION
**Goal**: Address compliance gaps from initial implementation

### Additional Tasks (Remediation)
- [ ] [Gap fix 1]
- [ ] [Gap fix 2]
- [ ] Re-run compliance review

**Status**: [in-progress]
**Remediation Shard**: `features/phase-X-name-remediation.md`
```

### 6A.4 Get User Approval

Present the remediation plan to the user:

```markdown
## Remediation Plan

**Compliance Gaps Identified**: [N]

### New/Updated Shards:
- `features/phase-X-name-remediation.md`

### Implementation Tasks:
1. [Task 1] - Est. [time]
2. [Task 2] - Est. [time]

### Updated Checklist Items:
- [ ] [New checklist item 1]
- [ ] [New checklist item 2]

**Total Estimated Effort**: [time]

Do you approve this remediation plan? (yes/no)
```

### 6A.5 Implement Fixes

If approved:

1. Implement each remediation task
2. Run quality checks after each significant change:
   ```bash
   pnpm lint
   pnpm tsc --noEmit
   ```
3. Mark checklist items as complete

### 6A.6 Re-run Compliance Review

After implementation:

```markdown
Remediation implementation complete. Re-running compliance review...
```

**GO BACK TO STEP 2** and repeat the compliance review.

**This loop continues until:**
- All requirements pass, OR
- User explicitly waives compliance

---

## Step 6: Proceed with End-Session (on PASS only)

Once compliance passes:

```markdown
✅ **COMPLIANCE VERIFIED**

Phase [X] implementation meets all specification requirements.
Proceeding with standard end-session workflow...
```

**Execute the standard `/end-session` workflow.**

---

## Compliance Review Notes

### What Gets Checked:
- File existence and location
- Component props match spec interfaces
- Required functionality is implemented
- TypeScript compiles without errors
- Lint passes
- Build succeeds
- Dev server starts without errors

### What Does NOT Get Checked (UAT covers these):
- Visual appearance matches design
- User experience quality
- Edge case handling completeness
- Cross-browser compatibility
- Performance benchmarks

### Severity Levels:
- **CRITICAL**: Missing core deliverable - blocks compliance
- **MAJOR**: Missing acceptance criterion - blocks compliance  
- **MINOR**: Implementation differs from spec but functional - warning only
- **INFO**: Suggestion for improvement - does not block

---

**BEGIN NOW: Start with Step 1 - Identify Current Phase.**
