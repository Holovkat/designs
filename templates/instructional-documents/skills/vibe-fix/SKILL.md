---
name: vibe-fix
description: Use when the user asks for a small pragmatic behavior fix based on observed app behavior. Guides the agent to create a GitHub issue linked to the active epic, find the actual runtime owner, make the smallest durable change, verify live behavior, and sign off with evidence.
---

# Vibe Fix

Handle small behavior fixes with disciplined pragmatism: identify the request,
find the real source of behavior, make the smallest durable change, verify it
live, and stop.

**CRITICAL RULES:**
1. **GITHUB IS THE SOURCE OF TRUTH** - Create a GitHub issue for the fix, linked to the active epic. Do not use a local checklist.
2. **BRANCH IDENTIFIES THE EPIC** - Parse the current branch to find the active epic, same as `/next-phase`.
3. **LINK THE ISSUE TO THE EPIC** - The new issue must be linked to the epic so it appears in the epic's tracked issues.
4. **KEEP USER-FACING OUTPUT BRIEF** - Status updates only during execution. All detailed information goes into the GitHub issue. Do not repeat to the user what has been written to GitHub.

## Workflow

1. Identify the active repo, branch, dirty worktree state, and nearest project
   instructions.
2. Identify the active epic from the current branch (strip harness prefix,
   match slug against open epics). If no epic matches, use the oldest open epic
   or ask the user.

```bash
gh issue list --label "epic" --state open --json number,title --jq '.[] | "\(.number) \(.title)"'
```

3. Create a GitHub issue for the fix, labeled `task`, and link it to the active
   epic. The issue body should contain: what to fix, files involved, acceptance
   criteria, and verification steps.

```bash
gh issue create \
  --title "Vibe Fix: [brief description]" \
  --label "task,vibe-fix" \
  --body "## Vibe Fix

**Epic**: #[EPIC_NUMBER]
**Branch**: [branch-name]
**Observed**: [what was seen]

### What
[1-2 sentences: what needs fixing]

### Files
- \`[path/to/file]\` - [what to change]

### Acceptance Criteria
- [ ] [criterion]

### Verification
- [ ] [how to verify]

_Created by vibe-fix on [DATE]_
"
```

Link the issue to the epic by adding it to the epic's task list:

```bash
gh issue edit [EPIC_NUMBER] --body "[updated body with new issue number in task list]"
```

4. Inspect live behavior before editing when practical.
5. Locate the actual behavior owner and avoid duplicate sources of truth.
6. Make the smallest scoped change.
7. Add or update a focused test only where it locks the behavior that failed.
8. Verify with the most direct evidence: targeted test, runtime/API check, and
   browser check for user-visible behavior.
9. Review the final diff for duplicate logic, stale ineffective code, unrelated
   dirty files, and validation gaps.
10. Post a sign-off comment on the issue with evidence, then close it.

```bash
gh issue comment [ISSUE_NUMBER] --body "## Fix Signed Off

**Files changed**: [list]
**Verification**: [test/run evidence]
**Browser/runtime evidence**: [screenshot or check result]
**Result**: Fixed

_Signed off by vibe-fix on [DATE]_"

gh issue close [ISSUE_NUMBER]
```

## Guardrails

- Do not broaden into refactors, redesigns, migrations, or cleanup unless
  required for the fix.
- Do not trust configuration or code that appears correct until live behavior
  confirms it is effective.
- If two layers can implement the same behavior, choose one source of truth.
- Preserve unrelated dirty work.
- If specialist ownership is required by the project, delegate or request
  specialist validation before acting in that domain.

## Output

Report briefly to the user. Do not repeat what was written to GitHub.

- issue created: #[NN]
- files changed: [list]
- verification: [pass/fail]
- signed off: yes/no
