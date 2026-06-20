---
name: vibe-fix
description: Use when the user asks for a small pragmatic behavior fix based on observed app behavior. Guides the agent to ticket or record the fix, find the actual runtime owner, make the smallest durable change, verify live behavior, and sign off with evidence.
---

# Vibe Fix

Handle small behavior fixes with disciplined pragmatism: identify the request,
find the real source of behavior, make the smallest durable change, verify it
live, and stop.

## Workflow

1. Identify the active repo, branch, dirty worktree state, and nearest project
   instructions.
2. Determine whether the request belongs to an active branch epic, issue,
   checklist, or local project tracker.
3. Create or draft the smallest useful ticket when the project uses issue
   tracking.
4. Inspect live behavior before editing when practical.
5. Locate the actual behavior owner and avoid duplicate sources of truth.
6. Make the smallest scoped change.
7. Add or update a focused test only where it locks the behavior that failed.
8. Verify with the most direct evidence: targeted test, runtime/API check, and
   browser check for user-visible behavior.
9. Review the final diff for duplicate logic, stale ineffective code, unrelated
   dirty files, and validation gaps.
10. Sign off only after live behavior matches the requested outcome.

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

Report:

- ticket created or drafted
- files changed
- verification run
- browser/runtime evidence
- remaining dirty unrelated files
- whether the fix is signed off
