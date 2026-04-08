---
description: Continue implementing the next phase with the governed builder flow
---

You are continuing implementation from the project checklist. Task specifications live in **GitHub issues**. Work happens in the governed execution worktree created by `/start-session`; in serial chains this is the shared sprint worktree, while true parallel lanes may use dedicated task worktrees. The governed builder flow should use the global builder pack when available.

**CRITICAL RULES:**
1. **GITHUB ISSUES ARE THE SPEC** - Keep the issue body stable and use comments for execution history
2. **FREEZE THE TASK PACKET BEFORE CODING** - Declare owned files, contracts, schema, test data, artifacts, preload steps, fixtures, validation scope, and line-stop conditions up front
3. **USE THE BUILDER ORCHESTRATOR WHEN AVAILABLE** - Prefer real subagent delegation over inline roleplay
4. **ONE WARM WRITER PER TASK** - Route findings back into the same `dev` session
5. **HIDDEN PREREQUISITES LINE-STOP** - Substantial missing schema, data, or artifacts go back to replanning
6. **DO NOT CHECK OFF THE LOCAL CHECKLIST HERE** - Final sign-off stays with orchestration/UAT
7. **USE THE ISSUE'S WORKTREE PATH** - Do not derive a different local path when the issue already declares one
8. **TASK BRANCHES MUST USE `codex/`** - If the issue omits `Task Branch`, derive `codex/[task-slug]`
9. **GREEN TASKS MUST EXIT THROUGH `/end-session`** - Do not stop with uncommitted success in the current execution worktree
10. **SEQUENTIAL SPRINT MODE IS DEFAULT** - Reuse one prepared sprint worktree for serial tasks and reserve per-task worktrees for true parallel lanes

---

## WORKFLOW

| Step | Description | Interactive? |
|------|-------------|--------------|
| 1 | Check uncommitted changes | No |
| 2 | Read implementation checklist | No |
| 3 | Determine worktree status | No |
| 4 | Fetch task specs from GitHub issues | No |
| 4b | Run workspace prep | No |
| 4c | Freeze the builder task packet | No |
| 5 | Generate test scenarios | **YES** |
| 6 | Post scenarios to GitHub | No |
| 7 | Present implementation plan | No |
| 8 | Governed implementation via builder lanes | No |
| 9 | Update GitHub issue handoff state | No |
| 10 | Session summary | No |

## Step 2: Read Checklist

```bash
cat templates/functional-design/00-IMPLEMENTATION-CHECKLIST.md
```

Find first sprint with `- [ ] #[issue]` items. Extract epic and task issue numbers.

Before using the checklist as the source of truth, verify it is tracked:

```bash
git ls-files --error-unmatch templates/functional-design/00-IMPLEMENTATION-CHECKLIST.md
```

If it is only untracked local state, line-stop and commit/bootstrap the planning
artifacts first.

## Step 3: Determine Worktree Status

```bash
git rev-parse --show-toplevel
git branch --show-current
git worktree list
```

Never implement from the primary checkout or on `main`.

Default builder mode is a shared sprint worktree for serial chains. Use the
issue-specific task branch/worktree only when a real parallel split or isolated
replay is justified.

Before creating a fresh task worktree, verify the repo actually has tracked
content to work with:

```bash
git ls-files | head
```

If tracked content is effectively empty and the task is not explicitly a
bootstrap-from-empty-repo task, line-stop instead of creating an empty shell
worktree.

## Step 4: Fetch Task Specs

```bash
gh issue view [TASK_NUMBER] --json number,title,body,labels,state
```

Extract requirements, file paths, interfaces, patterns, acceptance criteria,
complexity, dependencies, task branch, base branch, and worktree path from the issue body.

For a serial chain, treat the issue-level task branch/worktree as advisory
metadata. The active execution surface should be the shared sprint branch and
worktree.

## Step 4b: Run Workspace Prep Yourself

```bash
/workspace-prep [worktree-path]
```

## Step 4c: Freeze the Builder Task Packet

The packet must declare:
- `task_id`
- `issue_refs`
- `owned_files`
- `input_contracts`
- `output_contracts`
- `required_schema`
- `required_test_data`
- `required_artifacts`
- `preload_steps`
- `fixture_locations`
- `validation_scope`
- `regression_surface`
- `line_stop_conditions`

## Step 5: Generate Scenarios (Interactive)

For each task, present test scenarios (HP, EC, EX) and wait for user approval before proceeding.

## Step 6: Post to GitHub

Post approved scenarios as comments on task issues.

## Step 8: Implement

If `builder_orchestrator` is installed, invoke it as a real subagent and let it
coordinate:
- `dev` as the sole durable writer
- `reviewer`, `tester`, and `compliance` as read-only lanes

Keep the task packet frozen, preserve one warm `dev` session per task, and
line-stop back to replanning if substantial hidden prerequisites appear.
For adjacent serial tasks, keep reusing the same prepared sprint worktree
instead of allocating a new task worktree for each issue.

If the user started this task flow intentionally and prep succeeded, do not stop with an "if you want" prompt. Continue automatically into the governed build flow unless blocked.

If implementation and verification succeed, immediately run `/end-session` from
the same task worktree so `/builder-handoff`, labels, commit, and push are all
completed before the run stops. Only blocked tasks should stop with
`/builder-handoff` alone.

Use explicit wording before that handoff:
- green task: `Decision: proceeding directly to /end-session`
- blocked task: `Decision Needed: [exact choice]`
- bootstrap-only success: say it satisfies bootstrap scope without implying full epic completion

## Step 9: Update

1. Leave a canonical `Builder Handoff` comment
2. Apply `ready-for-integration`, `integration-pending`, `builder-blocked`, or `needs-replan`
3. Do **not** close the task issue or check off the local checklist here

---

**BEGIN NOW:** Read the checklist, fetch the task issue, prepare the worktree, freeze the builder packet, review scenarios, then implement through the governed builder flow.
