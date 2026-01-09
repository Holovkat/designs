---
description: Interactive planning session to scope and document a new feature
---

You are conducting an **interactive planning session** to scope a new feature. This process will interview the user, analyze the codebase, and produce implementable specifications.

**CRITICAL RULES:**
1. **ONE QUESTION AT A TIME** - Never ask multiple questions in a single response
2. **WAIT FOR ANSWERS** - Do not proceed until the user responds
3. **INTERVIEW MODE** - This is a conversation, not a checklist dump
4. **COMPLETE ALL MANDATORY STEPS** - You MUST complete Steps 1-4 (interview), then Steps 6-10 (artifacts). Do NOT stop after the interview.

---

## MANDATORY WORKFLOW OVERVIEW

| Step | Description | Required? |
|------|-------------|-----------|
| 1 | Context Gathering | **MANDATORY** |
| 2 | Initiate Interview | **MANDATORY** |
| 3 | Interview Questions | **MANDATORY** |
| 4 | Confirm Understanding | **MANDATORY** |
| 5 | Deep Analysis (kingmode) | OPTIONAL - only if complex |
| 6 | Determine Sprint Placement | **MANDATORY** |
| 7 | Generate Shard Document | **MANDATORY** |
| 8 | Update Implementation Checklist | **MANDATORY** |
| 9 | Update Project Documentation | OPTIONAL - if needed |
| 10 | Planning Summary | **MANDATORY** |

**DO NOT STOP after Step 4.** After user confirms understanding, you MUST proceed to create the shard document (Step 7) and update the checklist (Step 8).

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
ls features/*.md 2>/dev/null
```

### 1.3 Review Recent Git Activity

```bash
# Recent changes and current state
git log --oneline -15
git status
git branch --show-current
```

### 1.4 Identify Tech Stack

```bash
# Determine project type and dependencies
cat package.json 2>/dev/null | head -50
cat pyproject.toml 2>/dev/null | head -30
ls -la src/ 2>/dev/null || ls -la app/ 2>/dev/null || ls -la lib/ 2>/dev/null
```

**Store this context internally. Do not output it to the user yet.**

---

## Step 2: Initiate Interview

**ACTION REQUIRED:** Begin the interview. If the user provided an initial prompt, acknowledge it and start clarifying. If not, ask the opening question.

### 2.1 Opening (if no initial prompt provided)

> "Let's plan your new feature. To create a solid implementation spec, I'll ask you some questions one at a time.
>
> **What feature would you like to build?**
>
> Please describe it in your own words - it can be rough, we'll refine it together."

### 2.2 Opening (if initial prompt WAS provided)

> "I see you want to build: [summarize their prompt in 1-2 sentences]
>
> Let me ask some clarifying questions to fully scope this out.
>
> **[First clarifying question based on what's unclear or missing from their prompt]**"

---

## Step 3: Interview Questions

**INTERVIEW PROTOCOL:**
- Ask ONE question, wait for response
- Acknowledge their answer briefly before the next question
- Adapt questions based on their responses
- Skip questions that have already been answered
- Keep a running mental model of the feature

### 3.1 WHAT - Feature Definition

Ask these (one at a time, as needed):

1. "What problem does this feature solve for users?"
2. "Can you describe the user journey? What does the user do step-by-step?"
3. "What should the user see/experience when this feature is complete?"
4. "Are there any existing features this interacts with or extends?"

### 3.2 WHY - Business Context

Ask these (one at a time, as needed):

1. "Why is this feature needed now? What's driving this?"
2. "Who is the primary user of this feature?"
3. "What happens if we don't build this?"

### 3.3 HOW - Technical Scope

Ask these (one at a time, as needed):

1. "Do you have preferences for how this should be implemented technically?"
2. "Are there any technical constraints I should know about? (APIs, libraries, patterns)"
3. "Should this follow any existing patterns in the codebase?"
4. "Are there any third-party integrations required?"

### 3.4 SCOPE - MVP Definition

Ask these (one at a time, as needed):

1. "What's the minimum version of this feature that would be useful? (MVP)"
2. "What could we defer to a future iteration?"
3. "Are there any hard requirements vs nice-to-haves?"

### 3.5 ACCEPTANCE - Success Criteria

Ask this to conclude:

1. "How will we know this feature is complete? What would you test?"

---

## Step 4: Interview Completion Check

**After gathering sufficient information, confirm understanding:**

> "Let me summarize what I've captured:
>
> **Feature:** [Name/Title]
>
> **Problem:** [What problem it solves]
>
> **User Journey:**
> 1. [Step 1]
> 2. [Step 2]
> 3. [etc.]
>
> **MVP Scope:**
> - [Core requirement 1]
> - [Core requirement 2]
>
> **Deferred/Future:**
> - [Nice-to-have 1]
> - [Nice-to-have 2]
>
> **Technical Notes:**
> - [Any constraints or preferences mentioned]
>
> **Does this capture your vision? Any corrections or additions?**"

**Wait for user confirmation before proceeding.**

**IMPORTANT: Once user confirms (or after any corrections), you MUST proceed to Step 6 to create artifacts. Do NOT stop here.**

---

## Step 5: Deep Analysis (OPTIONAL)

**This step is OPTIONAL.** Only trigger if the feature is complex (3+ components, integrations, or architectural decisions).

**If the feature is complex (3+ components, integrations, or architectural decisions), trigger deep analysis:**

> "This feature has some complexity. Let me do a deeper analysis before creating the spec..."

**Activate `/kingmode` analysis:**

```markdown
/kingmode

Analyze this planned feature for implementation:

## Feature Summary
[Insert summary from Step 4]

## Analysis Required:
1. What existing code/components can be reused?
2. What new components/modules need to be created?
3. What are the technical risks or challenges?
4. How should this be broken into implementable phases?
5. What are the dependencies between phases?
6. Are there any architectural decisions to make?

## Codebase Context:
[Insert relevant findings from Step 1]
```

**If the feature is simple (1-2 components, straightforward), skip to Step 6.**

---

## Step 6: Determine Sprint Placement (MANDATORY)

**ACTION REQUIRED - THIS STEP IS MANDATORY.** Check current implementation state and decide placement.

### 6.1 Read Current Checklist

```bash
cat features/00-IMPLEMENTATION-CHECKLIST.md 2>/dev/null
```

### 6.2 Analyze Checklist State

Check for:
- Existing incomplete sprints (`- [ ]` items)
- Completed sprints (`- [x]` items)
- Backlogged items

### 6.3 Determine Next Sprint Number

Find the highest existing sprint number and increment by 1 for the new sprint.

### 6.4 Handle Existing Incomplete Sprints

**If there ARE incomplete sprints, ask the user:**

> "I see there are incomplete items in existing sprints:
>
> **[Sprint X: Name]**
> - [ ] [Incomplete item 1]
> - [ ] [Incomplete item 2]
>
> For this new feature, would you like to:
> 1. **Create a new sprint** - Add as Sprint [N+1] at the end
> 2. **Add to existing sprint** - Incorporate into [Sprint X]
>
> Reply 1 or 2."

**If NO incomplete sprints (all complete or checklist empty):**

Proceed with creating a new sprint at the end.

---

## Step 7: Generate Shard Document (MANDATORY)

**ACTION REQUIRED - THIS STEP IS MANDATORY.** You MUST create the technical specification shard document. Do NOT skip this step.

### 7.1 Determine Shard Number and Filename

Use the next available number based on existing shards:

```bash
ls features/*.md 2>/dev/null | grep -E '^features/[0-9]+-' | sort -n | tail -1
```

**Naming convention:** `[NN]-[feature-name].md`
- Example: `03-user-authentication.md`, `04-dashboard-widgets.md`

### 7.2 Create the Shard Document

**Use the Create tool** to create `features/[NN]-[feature-name].md`:

```markdown
# [Feature Name] - Technical Specification

## Document Metadata
- **Feature**: [Feature Name]
- **Sprint**: Sprint [N] - [Sprint Name]
- **Created**: [TODAY'S DATE]
- **Status**: Planning Complete
- **Priority**: [High/Medium/Low based on user input]

---

## 1. Overview

### 1.1 Problem Statement
[What problem this feature solves - from interview]

### 1.2 Solution Summary
[High-level description of the solution]

### 1.3 User Story
As a [user type], I want to [action], so that [benefit].

---

## 2. User Journey

### 2.1 Primary Flow
1. [Step 1 - User action]
2. [Step 2 - System response]
3. [Step 3 - User action]
4. [Continue as needed...]

### 2.2 Alternative Flows
- [Alternative path 1]
- [Alternative path 2]

### 2.3 Error Flows
- [Error scenario 1 and handling]
- [Error scenario 2 and handling]

---

## 3. Technical Requirements

### 3.1 Components to Create
| Component | Type | Location | Description |
|-----------|------|----------|-------------|
| [ComponentName] | [atom/molecule/organism/page] | `src/components/...` | [Brief description] |

### 3.2 Components to Modify
| Component | Location | Changes Required |
|-----------|----------|------------------|
| [ComponentName] | `src/components/...` | [What changes] |

### 3.3 Data/State Requirements
- **New State**: [What state needs to be added]
- **API Endpoints**: [What APIs are needed]
- **Data Models**: [What types/interfaces]

### 3.4 Dependencies
- **Internal**: [Existing components/features this depends on]
- **External**: [Third-party libraries needed]

---

## 4. Implementation Phases

### Phase 1: [Foundation/Setup]
**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Phase 2: [Core Implementation]
**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### Phase 3: [Integration/Polish]
**Deliverables:**
- [ ] [Deliverable 1]
- [ ] [Deliverable 2]

**Acceptance Criteria:**
- [ ] [Criterion 1]
- [ ] [Criterion 2]

---

## 5. Acceptance Criteria (Overall)

### 5.1 Functional Requirements
- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### 5.2 Non-Functional Requirements
- [ ] Performance: [Specific metric if applicable]
- [ ] Accessibility: [WCAG requirements]
- [ ] Responsiveness: [Breakpoint requirements]

### 5.3 Definition of Done
- [ ] All functional requirements pass
- [ ] Code review completed
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Build succeeds
- [ ] Basic tests written

---

## 6. Out of Scope (Deferred)

Items explicitly deferred to future iterations:
- [Deferred item 1]
- [Deferred item 2]

---

## 7. Open Questions

Questions to resolve during implementation:
- [ ] [Question 1]
- [ ] [Question 2]

---

## 8. References

- **Related Shards**: [Links to related feature docs]
- **Design References**: [Links to designs if any]
- **External Docs**: [Links to API docs, libraries, etc.]

---

*Generated by /plan-feature on [TODAY'S DATE]*
```

---

## Step 8: Update Implementation Checklist (MANDATORY)

**ACTION REQUIRED - THIS STEP IS MANDATORY.** You MUST update the implementation checklist with the new sprint and tasks. Do NOT skip this step.

### 8.1 Read Current Checklist

```bash
cat features/00-IMPLEMENTATION-CHECKLIST.md
```

### 8.2 Edit the Checklist

**Use the Edit tool** to append the new sprint at the appropriate location:

```markdown
---

## Sprint [N]: [Feature Name]
**Goal**: [One-line goal from interview]
**Shard**: [`[NN]-[feature-name].md`](./[NN]-[feature-name].md)

### Epic: [Main Epic Name]
- [ ] [Task 1 from Phase 1]
- [ ] [Task 2 from Phase 1]
- [ ] [Task 3 from Phase 2]
- [ ] [Task 4 from Phase 2]
- [ ] [Task 5 from Phase 3]

### Epic: [Secondary Epic if applicable]
- [ ] [Task 1]
- [ ] [Task 2]
```

### 8.3 Verify the Edit

Read the file again to confirm the changes were applied correctly.

---

## Step 9: Update Project Documentation (If Needed)

**Check if AGENTS.md or README.md need updates:**

If the feature introduces:
- New major components or patterns
- New directories or file conventions
- New commands or workflows

**Ask the user:**

> "This feature introduces [new pattern/component/etc]. Should I update:
> - [ ] AGENTS.md - Add to JIT index
> - [ ] README.md - Update feature list
>
> Reply with which to update, or 'skip' to proceed without updates."

---

## Step 10: Planning Summary (MANDATORY)

**ACTION REQUIRED - THIS STEP IS MANDATORY.** Present the final summary confirming what was created.

```markdown
## ✅ Feature Planning Complete

### Documents Created
- **Shard**: `features/[NN]-[feature-name].md`
- **Checklist Updated**: `features/00-IMPLEMENTATION-CHECKLIST.md`

### Sprint Overview
**Sprint [N]: [Feature Name]**
- **Tasks**: [X] tasks across [Y] phases
- **Estimated Complexity**: [Simple/Medium/Complex]

### Implementation Tasks
1. [ ] [Task 1]
2. [ ] [Task 2]
3. [ ] [Task 3]
... [etc]

### Next Steps
To begin implementation, run:
```
/start-session feature/[feature-name]
```

Or continue with existing work:
```
/next-phase
```

### Files to Reference During Implementation
- `features/[NN]-[feature-name].md` - Full technical spec
- `features/00-IMPLEMENTATION-CHECKLIST.md` - Task tracking
```

---

## Handling Edge Cases

### If user wants to cancel mid-interview:

> "No problem. Planning session cancelled. No documents were created.
>
> Run `/plan-feature` again when you're ready."

### If checklist doesn't exist:

Create it with the new sprint as Sprint 1:

```markdown
# Implementation Checklist

Track implementation progress across all sprints.

---

## Sprint 1: [Feature Name]
**Goal**: [Goal]
**Shard**: [`01-[feature-name].md`](./01-[feature-name].md)

### Epic: [Epic Name]
- [ ] [Task 1]
- [ ] [Task 2]
```

### If features/ directory doesn't exist:

```bash
mkdir -p features
```

Then create both the checklist and shard.

---

**BEGIN NOW:** 
1. Start with Step 1 - Context Gathering (silently)
2. Proceed to Steps 2-4 - Interview the user
3. **THEN YOU MUST** proceed to Steps 6-8 to create the shard document and update the checklist
4. Finally, present the summary in Step 10

**The planning session is NOT complete until the shard document exists and the checklist is updated.**
