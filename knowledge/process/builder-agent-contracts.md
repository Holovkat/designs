---
type: Process
title: Builder Agent Contracts
description: Codex global builder agent pack defining orchestrator, dev, reviewer, tester, compliance roles with warm continuity and task packets
resource: ./templates/instructional-documents/codex-global-builder-agents.md
tags: [designs, codex, builder, agents, orchestrator, dev, reviewer, tester, compliance, contracts]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Builder Agent Contracts

## Overview

The v1 builder pack installed under `~/.codex/agents/` defines the governed build agents that begin from `/start-session` and stop at `ready-for-integration`.

## Goals

- Keep planning handoff separate from build execution
- Use `start-session` as explicit entrypoint into isolated worktree execution
- Preserve one warm writer session per task
- Reuse orchestrator-mediated communication pattern from planning pack

## Builder Roster

| Agent | Sandbox | Responsibility | Final Publisher |
|-------|---------|---------------|-----------------|
| builder_orchestrator | workspace-write | Intake, task-packet reconstruction, lane routing, warm continuity, line-stop/replan | Yes |
| dev | workspace-write | Sole durable writer for code, tests, fixtures, corrections | No |
| reviewer | read-only | Diff-scoped correctness, acceptance, owned-surface review | No |
| tester | read-only | Targeted verification against changed files, regression surface | No |
| compliance | read-only | Requirement traceability and final ready-for-integration gate | No |

## Ownership Boundaries

- `builder_orchestrator` does not edit implementation code; it governs build flow.
- `dev` is the only agent allowed to make durable edits in the task worktree.
- `reviewer`, `tester`, `compliance` are read-only by design.
- Builder v1 stops at `ready-for-integration`. UAT, QA, and production promotion are downstream.

## Worktree Execution Model

- `start-session` creates the isolated worktree and branch context
- Default mode is sequential sprint mode: one shared sprint worktree for serial dependency chain
- Separate task worktrees reserved for true parallel lanes, isolated replays, or explicit isolation

## Task Packet

Every task starts from a frozen task packet reconstructed from GitHub issue content, checklist state, comments, and repo context.

### Required Packet Fields

`task_id`, `issue_refs`, `goal`, `inferred_intent`, `confidence`, `project_trajectory`, `active_vectors`, `current_scope`, `constraints`, `non_goals`, `owned_files`, `input_contracts`, `output_contracts`, `required_schema`, `required_test_data`, `required_artifacts`, `preload_steps`, `fixture_locations`, `acceptance_criteria`, `validators`, `validation_scope`, `regression_surface`, `release_vector_matrix`, `lessons_learned`, `open_findings`, `line_stop_conditions`.

### Packet Freeze Rule

No parallel lane may start until the task packet is frozen. Missing substantial schema, data, or artifacts is a prerequisite planning failure that line-stops back to replanning.

## Lane Sequence

1. `start-session` creates shared sprint worktree
2. `builder_orchestrator` reconstructs and freezes task packet
3. `dev` starts warm implementation session
4. `builder_orchestrator` captures narrow change snapshot
5. `reviewer` and `tester` run from same stable snapshot
6. `compliance` runs after correction loop is clean
7. Findings route back into same warm `dev` session
8. On success, task exits as `ready-for-integration`
9. Next adjacent serial task reuses same sprint worktree

## Warm Builder Continuity

The same `dev` session is reused across build, review-fix, test-fix, and compliance-fix loops. Reviewer, tester, and compliance remain stateless lanes.

## Complexity Rules

- Small task-local fixtures/mocks remain in `dev` lane
- Large schema, data-shaping, or broad environment setup must be split into prerequisites
- Hidden prerequisite discovery is a line-stop, not "figure it out in dev"

## Related Concepts

- [Planning Agent Contracts](./planning-agent-contracts.md)
- [Planning Decomposition](./planning-decomposition.md)
- [Delivery Lifecycle](./delivery-lifecycle.md)
- [Implementation Checklist](./implementation-checklist.md)
- [Agent Generation](./agent-generation.md)
