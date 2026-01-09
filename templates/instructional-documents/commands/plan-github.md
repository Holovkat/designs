---
description: Import GitHub issues/PRs and convert them into implementation specs
---

You are conducting an **interactive planning session** to import GitHub issues or pull requests and convert them into actionable implementation specifications.

**CRITICAL RULES:**
1. **ONE QUESTION AT A TIME** - Never ask multiple questions in a single response
2. **WAIT FOR ANSWERS** - Do not proceed until the user responds
3. **INTERVIEW MODE** - Clarify and enrich the GitHub data through conversation

---

## Step 1: Check GitHub CLI & Repository

**ACTION REQUIRED:** Verify GitHub CLI is available and authenticated.

```bash
# Check gh CLI is available
gh --version

# Check if we're in a git repo with a GitHub remote
gh repo view --json name,owner,url 2>/dev/null || echo "NO_GITHUB_REPO"
```

### If NO GitHub repo detected:

> "This directory doesn't appear to be connected to a GitHub repository.
>
> Would you like to:
> 1. **Specify a repository** - Provide a repo in `owner/repo` format
> 2. **Cancel** - Exit planning session
>
> Reply with 1 and the repo name (e.g., '1 myorg/myrepo'), or 2 to cancel."

**If user provides repo, store it for `-R` flag usage in subsequent commands.**

---

## Step 2: Determine Import Source

**ACTION REQUIRED:** Ask the user what they want to import.

> "What would you like to import from GitHub?
>
> 1. **A specific issue** - Import by issue number (e.g., #42)
> 2. **A specific PR** - Import by PR number
> 3. **Browse open issues** - Show list to choose from
> 4. **Browse open PRs** - Show list to choose from
> 5. **Search issues** - Search by label, assignee, or keyword
>
> Reply with a number (1-5), or provide an issue/PR number directly (e.g., '#42' or 'PR #15')."

---

## Step 3: Fetch GitHub Data

**Based on user selection, fetch the relevant data.**

### 3.1 If Specific Issue Number

```bash
gh issue view [NUMBER] --json number,title,body,labels,assignees,milestone,comments,state,createdAt,author,url
```

### 3.2 If Specific PR Number

```bash
gh pr view [NUMBER] --json number,title,body,labels,assignees,files,comments,reviews,state,createdAt,author,url,additions,deletions,changedFiles,closingIssuesReferences
```

### 3.3 If Browse Open Issues

```bash
gh issue list --state open --limit 20 --json number,title,labels,assignees,createdAt,author
```

**Present the list:**

> "Here are the open issues:
>
> | # | Title | Labels | Assignee | Created |
> |---|-------|--------|----------|---------|
> | [number] | [title] | [labels] | [assignee] | [date] |
>
> **Which issue would you like to import?** (Enter the issue number)"

Then fetch full details with `gh issue view [NUMBER] --json ...`

### 3.4 If Browse Open PRs

```bash
gh pr list --state open --limit 20 --json number,title,labels,author,createdAt,isDraft
```

**Present the list:**

> "Here are the open pull requests:
>
> | # | Title | Author | Draft | Created |
> |---|-------|--------|-------|---------|
> | [number] | [title] | [author] | [yes/no] | [date] |
>
> **Which PR would you like to import?** (Enter the PR number)"

Then fetch full details with `gh pr view [NUMBER] --json ...`

### 3.5 If Search Issues

> "What would you like to search for?
>
> You can search by:
> - **Label**: e.g., 'label:bug' or 'label:enhancement'
> - **Assignee**: e.g., 'assignee:username' or 'assignee:@me'
> - **Keyword**: e.g., 'login error' or 'dashboard'
> - **Combined**: e.g., 'label:bug login'
>
> Enter your search query:"

```bash
gh issue list --search "[USER_QUERY]" --limit 20 --json number,title,labels,assignees,createdAt
```

Present results and let user select.

---

## Step 4: Context Gathering

**ACTION REQUIRED:** While processing, silently gather project context.

```bash
# Project documentation
cat AGENTS.md 2>/dev/null || cat .factory/AGENTS.md 2>/dev/null
cat README.md 2>/dev/null

# Current implementation state
cat features/00-IMPLEMENTATION-CHECKLIST.md 2>/dev/null
ls features/*.md 2>/dev/null

# Recent git activity
git log --oneline -10
git status
```

---

## Step 5: Present GitHub Item Summary

**ACTION REQUIRED:** Show the user what was imported and begin clarification.

### 5.1 For Issues

> "## Imported Issue #[NUMBER]
>
> **Title:** [title]
> **Author:** [author] | **Created:** [date] | **State:** [state]
> **Labels:** [labels or 'None']
> **Assignees:** [assignees or 'Unassigned']
> **Milestone:** [milestone or 'None']
>
> ### Description
> [body content - format nicely]
>
> ### Comments ([count] comments)
> [Summarize key comments if any, or 'No comments']
>
> ---
>
> I'll now ask a few questions to create a proper implementation spec."

### 5.2 For Pull Requests

> "## Imported PR #[NUMBER]
>
> **Title:** [title]
> **Author:** [author] | **Created:** [date] | **State:** [state]
> **Labels:** [labels or 'None']
> **Base:** [baseRefName] ← **Head:** [headRefName]
>
> ### Description
> [body content]
>
> ### Changes
> **Files Changed:** [changedFiles] | **+[additions]** / **-[deletions]**
>
> ### Files Modified
> [List key files from the 'files' field]
>
> ### Linked Issues
> [closingIssuesReferences or 'None']
>
> ### Reviews
> [Summarize review status/comments]
>
> ---
>
> I'll now ask a few questions to create a proper implementation spec."

---

## Step 6: Clarification Interview

**INTERVIEW PROTOCOL:** Ask ONE question at a time based on what's missing or unclear from the GitHub data.

### 6.1 Determine Item Type

Based on labels and content, determine if this is:
- **Bug/Bugfix** - Has 'bug' label or describes broken behavior
- **Feature** - Has 'enhancement'/'feature' label or describes new functionality
- **Chore/Maintenance** - Has 'chore'/'maintenance' label or describes refactoring/cleanup

> "Based on the content, this appears to be a **[Bug/Feature/Chore]**. Is that correct?
>
> Reply 'yes' or specify: bug, feature, or chore."

### 6.2 Fill in Missing Information

**Ask these as needed (one at a time):**

**If issue description is vague:**
> "The issue description is brief. Can you provide more context about:
> **[specific unclear aspect]**"

**If no acceptance criteria:**
> "There are no clear acceptance criteria. How will we know this is complete?
> What should we be able to do/see when this is done?"

**If technical approach unclear:**
> "Do you have preferences for how this should be implemented?
> Any specific files, components, or patterns to use?"

**If scope unclear:**
> "What's the minimum scope for this? Is there anything that should be deferred?"

**If dependencies unclear:**
> "Does this depend on any other issues or features being completed first?"

### 6.3 For PRs - Additional Questions

**If PR is for review/completion:**
> "This PR has existing changes. Do you want to:
> 1. **Complete the PR** - Finish the implementation and merge
> 2. **Review and fix** - Address review comments and issues
> 3. **Document for handoff** - Create spec for someone else to complete
>
> Reply 1, 2, or 3."

**If PR has review comments:**
> "There are review comments to address:
> [List key review points]
>
> Should these all be addressed, or are any no longer relevant?"

---

## Step 7: Confirm Understanding

**ACTION REQUIRED:** Present a summary before generating artifacts.

> "Let me confirm my understanding:
>
> **Type:** [Bug/Feature/Chore]
> **Summary:** [One-line summary]
>
> **Problem/Goal:**
> [What needs to be done]
>
> **Acceptance Criteria:**
> - [ ] [Criterion 1]
> - [ ] [Criterion 2]
>
> **Technical Approach:**
> [Approach if discussed, or 'To be determined during implementation']
>
> **Scope:**
> - **In Scope:** [What's included]
> - **Out of Scope:** [What's deferred]
>
> **Does this capture everything correctly?**"

**Wait for user confirmation.**

---

## Step 8: Determine Sprint Placement

**ACTION REQUIRED:** Check current implementation state.

```bash
cat features/00-IMPLEMENTATION-CHECKLIST.md 2>/dev/null
```

### 8.1 Analyze Checklist State

Look for incomplete sprints and determine next sprint number.

### 8.2 Handle Existing Sprints

**If there ARE incomplete sprints:**

> "There are incomplete items in existing sprints:
>
> **[Sprint X: Name]**
> - [ ] [Incomplete item]
>
> For this GitHub item, would you like to:
> 1. **Create a new sprint** - Add as Sprint [N+1]
> 2. **Add to existing sprint** - Incorporate into Sprint [X]
>
> Reply 1 or 2."

**If no incomplete sprints:**

Create a new sprint.

---

## Step 9: Generate Shard Document

**ACTION REQUIRED:** Create the appropriate shard based on item type.

### 9.1 Determine Shard Number

```bash
ls features/*.md 2>/dev/null | grep -E '^features/[0-9]+-' | sort -n | tail -1
```

### 9.2 Create Shard Based on Type

**Naming convention:**
- Bug: `[NN]-bugfix-[description].md`
- Feature: `[NN]-[feature-name].md`
- Chore: `[NN]-chore-[description].md`

**Use the Create tool** to create `features/[NN]-[type]-[name].md`:

```markdown
# [Title] - Technical Specification

## Document Metadata
- **GitHub Reference**: [Issue/PR] #[number] - [url]
- **Type**: [Bug/Feature/Chore]
- **Sprint**: Sprint [N] - [Sprint Name]
- **Created**: [TODAY'S DATE]
- **Status**: Planning Complete
- **Priority**: [Based on labels/discussion]

---

## 1. Overview

### 1.1 GitHub Source
- **Issue/PR**: #[number]
- **Title**: [title]
- **Author**: [author]
- **Created**: [date]
- **Labels**: [labels]
- **URL**: [url]

### 1.2 Problem Statement
[Extracted/clarified from issue body and interview]

### 1.3 Solution Summary
[High-level approach]

---

## 2. Original GitHub Content

### 2.1 Description
> [Original issue/PR body - quoted]

### 2.2 Key Comments
> [Important comments from discussion - quoted]

---

## 3. Requirements

### 3.1 Functional Requirements
- [ ] [Requirement 1 - from issue + interview]
- [ ] [Requirement 2]

### 3.2 Acceptance Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]

### 3.3 Out of Scope
- [Deferred item 1]
- [Deferred item 2]

---

## 4. Technical Approach

### 4.1 Files to Create/Modify
| File | Action | Description |
|------|--------|-------------|
| `[path]` | Create/Modify | [What changes] |

### 4.2 Dependencies
- **Internal**: [Existing code this depends on]
- **External**: [Libraries/APIs needed]

### 4.3 Technical Notes
[Any technical considerations from the issue or interview]

---

## 5. Implementation Phases

### Phase 1: [Setup/Foundation]
- [ ] [Task 1]
- [ ] [Task 2]

### Phase 2: [Core Implementation]
- [ ] [Task 1]
- [ ] [Task 2]

### Phase 3: [Testing/Completion]
- [ ] [Task 1]
- [ ] [Task 2]

---

## 6. Testing Requirements

- [ ] [Test scenario 1]
- [ ] [Test scenario 2]
- [ ] Verify acceptance criteria met
- [ ] No regressions

---

## 7. Definition of Done

- [ ] All acceptance criteria pass
- [ ] Code review completed
- [ ] Tests pass
- [ ] No lint/type errors
- [ ] Build succeeds
- [ ] GitHub issue can be closed / PR can be merged

---

## 8. References

- **GitHub Issue/PR**: [url]
- **Related Issues**: [Any linked issues]
- **Related Code**: [Key files]

---

*Imported from GitHub by /plan-github on [TODAY'S DATE]*
```

---

## Step 10: Update Implementation Checklist

**ACTION REQUIRED:** Add to the checklist.

### 10.1 Read Current Checklist

```bash
cat features/00-IMPLEMENTATION-CHECKLIST.md
```

### 10.2 Edit the Checklist

**Use the Edit tool** to add the new sprint/tasks:

```markdown
---

## Sprint [N]: [Title from GitHub]
**Goal**: [One-line goal]
**Shard**: [`[NN]-[type]-[name].md`](./[NN]-[type]-[name].md)
**GitHub**: [Issue/PR] #[number]

### [Epic/Task Group Name]
- [ ] [Task 1 from phases]
- [ ] [Task 2]
- [ ] [Task 3]
- [ ] Close GitHub [issue/PR] #[number]
```

### 10.3 Verify Edit

Read the file to confirm.

---

## Step 11: Post GitHub Comment (MANDATORY)

**ACTION REQUIRED:** Add a comment to the GitHub issue/PR documenting the implementation plan.

**This step is NOT optional - always post the planning comment to maintain traceability.**

```bash
gh issue comment [NUMBER] --body "## Implementation Planned

This issue has been analyzed and scheduled for implementation.

**Sprint**: Sprint [N] - [Name]
**Shard Document**: \`features/[NN]-[name].md\`

**Implementation Tasks**:
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

_Planned via /plan-github on [DATE]_"
```

**For PRs, use:**

```bash
gh pr comment [NUMBER] --body "## Implementation Planned

This PR has been analyzed and scheduled for completion.

**Sprint**: Sprint [N] - [Name]
**Shard Document**: \`features/[NN]-[name].md\`

**Implementation Tasks**:
- [ ] [Task 1]
- [ ] [Task 2]
- [ ] [Task 3]

_Planned via /plan-github on [DATE]_"
```

**Confirm the comment was posted:**

> "Posted implementation plan to GitHub [issue/PR] #[number]."

---

## Step 12: Planning Summary

**ACTION REQUIRED:** Present the final summary.

```markdown
## ✅ GitHub Import Complete

### Source
- **GitHub [Issue/PR]**: #[number] - [title]
- **URL**: [url]
- **Type**: [Bug/Feature/Chore]

### Documents Created
- **Shard**: `features/[NN]-[type]-[name].md`
- **Checklist Updated**: `features/00-IMPLEMENTATION-CHECKLIST.md`

### Sprint Overview
**Sprint [N]: [Title]**
- **Tasks**: [X] tasks across [Y] phases
- **GitHub Reference**: #[number]

### Implementation Tasks
1. [ ] [Task 1]
2. [ ] [Task 2]
3. [ ] [Task 3]
4. [ ] Close GitHub #[number]

### Next Steps
To begin implementation, run:
```
/start-session [type]/[short-name]
```

Or continue with existing work:
```
/next-phase
```

### Files to Reference
- `features/[NN]-[type]-[name].md` - Full spec with GitHub context
- `features/00-IMPLEMENTATION-CHECKLIST.md` - Task tracking
- GitHub #[number] - Original issue/PR
```

---

## Handling Edge Cases

### If gh CLI not authenticated:

> "GitHub CLI is not authenticated. Please run:
> ```bash
> gh auth login
> ```
> Then try `/plan-github` again."

### If issue/PR not found:

> "Could not find [issue/PR] #[number]. Please verify:
> - The number is correct
> - You have access to this repository
> - The issue/PR exists and isn't deleted"

### If user wants to import multiple issues:

> "Would you like to import another issue after this one?
>
> Note: Each issue will create a separate shard. For related issues, consider grouping them into a single feature shard manually."

### If checklist doesn't exist:

Create it with this item as Sprint 1.

### If features/ directory doesn't exist:

```bash
mkdir -p features
```

---

## Quick Import Mode

**If user provides issue number directly with the command:**

Example: User types `/plan-github #42` or `/plan-github 42`

Skip to Step 3.1 immediately with that issue number, then continue normal flow from Step 4.

---

**BEGIN NOW: Start with Step 1 - Check GitHub CLI & Repository.**
