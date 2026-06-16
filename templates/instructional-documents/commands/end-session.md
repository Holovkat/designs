---
description: Close session with compliance gate, builder handoff, merge-back, and cleanup
---

You are closing out the current coding session. This includes quality checks,
compliance review, builder handoff updates, branch push, merge-back to the
recorded parent branch, and cleanup of the isolated worktree session. It does
**not** close the task, update the epic checklist as complete, or mark the
local implementation checklist done.

**CRITICAL RULES:**
1. **COMPLIANCE IS A GATE** - Cannot hand off cleanly until compliance passes or the issue is explicitly blocked
2. **USE BUILDER HANDOFF** - The issue comment and labels are the durable execution record
3. **CAPTURE PACKET/WARM-LOOP FACTS** - Record whether packet freeze held and whether warm `dev` continuity was preserved
4. **DO NOT CHECK OFF THE LOCAL CHECKLIST HERE** - Final sign-off happens later through orchestration/UAT
5. **COMPLETE ALL STEPS** - Do not skip the GitHub handoff, branch push, or merge-back cleanup

---

## WORKFLOW

| Step | Description |
|------|-------------|
| 1 | Run Quality Checks (lint, build) |
| 2 | Compliance Review (GATE) |
| 3 | Code Review |
| 4 | Gather builder handoff facts |
| 5 | Update GitHub issue handoff state |
| 6 | Update optional setup/data docs |
| 7 | Git Operations (commit, push) |
| 8 | Merge back to parent + cleanup |
| 9 | Summary |

## Step 1: Quality Checks

```bash
bun run lint 2>/dev/null || pnpm lint 2>/dev/null || npm run lint 2>/dev/null || true
bun run build 2>/dev/null || pnpm build 2>/dev/null || npm run build 2>/dev/null || true
```

## Step 2: Compliance Review (GATE)

Read acceptance criteria from the GitHub task issue and verify the current work.
If compliance fails and you cannot fix it in-session, hand off as blocked.

## Step 4: Gather Builder Handoff Facts

- task issue number
- branch
- worktree path
- commit SHA
- verification results
- lessons learned
- new prerequisites or setup changes
- data baseline, fixture, or dataset changes
- whether the task packet remained frozen
- whether warm `dev` continuity was preserved
- whether line-stop / replanning conditions were triggered or avoided

## Step 5: Update GitHub Issue Handoff State

Run `/builder-handoff` and let it:
- post the canonical handoff comment
- apply `ready-for-integration`, `integration-pending`, `builder-blocked`, and `needs-replan`
- update setup/data docs when needed

Do **not**:
- close the task issue
- close the epic
- update the epic checklist as complete
- mark the local checklist item `[x]`

## Step 7: Git Operations

```bash
git add -A
git commit -m "[type]: [short description]"
git push -u origin $(git branch --show-current) 2>/dev/null || git push origin $(git branch --show-current)
```

## Step 8: Merge Back to Parent + Cleanup

After the branch is committed, pushed, approved, and UAT has passed, run:

```bash
./commands/end-session.sh
```

That backend script should:
- rebase the session branch onto its recorded parent branch
- fast-forward merge the parent branch locally
- stop project-specific worktree runtime artifacts if required
- remove the session branch, worktree folder, and tmux pane

If the backend cleanup fails, stop and report the blocker instead of deleting state manually.

---

**BEGIN NOW:** Run quality checks, run the compliance gate, gather the builder handoff facts, invoke `/builder-handoff`, commit and push the task branch, then run `./commands/end-session.sh`.
