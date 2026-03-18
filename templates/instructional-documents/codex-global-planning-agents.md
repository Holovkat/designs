# Codex Global Planning Agents

This document defines the v1 planning pack installed under `~/.codex/agents/`.
It is the source-of-truth contract for the global planning agents used by
`/plan-feature`, `/plan-bugfix`, and `/plan-github`.

## Goals

- Keep planning orchestration separate from implementation work.
- Push lower-cost analysis into specialist agents while preserving a single final
  planning publisher.
- Reduce context repetition through a condensed shared brief.
- Keep delegated work observable through built-in Codex subagent activity.

## Operating Mode

Before committing to a planning depth, the orchestrator must ask the user how it
should operate.

- `quick-fix`: minimize specialist calls, keep the issue tree narrow, and favor
  the smallest useful plan.
- `full-planning`: use the standard multi-agent planning flow with specialist
  analysis, synthesis, and canary validation.

If the user does not specify a mode, ask one direct question:
"Do you want a quick-fix pass or the full planning flow?"

## Agent Roster

| Agent | Model | Reasoning | Sandbox | Responsibility | Final publisher |
| --- | --- | --- | --- | --- | --- |
| `blueprint_orchestrator` | `gpt-5.4-mini` | `xhigh` | `workspace-write` | Interview, decide delegation, synthesize findings, publish GitHub planning artifacts, update checklist | Yes |
| `req-analyst` | `gpt-5.4-mini` | `xhigh` | `read-only` | Requirement clarity, scope gaps, ambiguous assumptions, acceptance framing | No |
| `ux-analyst` | `gpt-5.4-mini` | `xhigh` | `read-only` | Workflow, operator experience, screen impact, visible planning outputs | No |
| `scenario-analyst` | `gpt-5.4-mini` | `xhigh` | `read-only` | Happy path, edge cases, exception coverage, regression scenarios | No |
| `tech-analyst` | `gpt-5.4-mini` | `xhigh` | `read-only` | Constraints, dependencies, sequencing, implementation-facing planning risks | No |
| `prd-writer` | `gpt-5.4-mini` | `xhigh` | `read-only` | Draft issue-ready blueprint sections, acceptance criteria, deferred scope notes, checklist-ready summaries | No |

## Ownership Boundaries

- `blueprint_orchestrator` is planning-only. It may create or edit planning
  issues and the local implementation checklist, but it may not edit
  implementation code.
- Specialists are read-only and report findings back to the orchestrator. They
  may not publish final GitHub issues, edit the checklist, or perform coding.
- Planning handoff stops at GitHub issues plus checklist updates. Build or
  implementation work starts only from a later explicit user command.

## Shared Brief

Every delegated specialist starts from the latest condensed shared brief.
The orchestrator owns this brief and refreshes it after every completed or
blocked delegation.

### Required brief fields

- `planning_command`: one of `/plan-feature`, `/plan-bugfix`, `/plan-github`
- `goal`: the current planning objective
- `current_scope`: confirmed MVP or fix scope
- `constraints`: technical, product, or process constraints
- `non_goals`: explicitly deferred or excluded work
- `references`: relevant repo docs, issues, or screenshots
- `lessons_learned`: active lessons from prior delegations or canary runs
- `open_questions`: unresolved items for the current stage
- `expected_output`: what the specialist must return

## Communication Protocol

Codex custom agents do not have direct peer-to-peer messaging. v1 uses an
orchestrator-mediated protocol:

1. `blueprint_orchestrator` decides whether a specialist is needed.
2. The orchestrator delegates with the current shared brief and a clear ask.
3. Specialists return a fixed payload.
4. The orchestrator relays blockers, open questions, or follow-up findings into
   later delegations.
5. The orchestrator distills lessons learned before moving to the next stage.

### Specialist payload

Every specialist response must include:

- `task_id`
- `owner`
- `status`
- `deps`
- `blockers`
- `next`
- `eta`
- `evidence`

### Status lifecycle

Delegated work must use this lifecycle:

`queued -> claimed -> working -> blocked | ready -> done`

`needs-follow-up` is allowed when the orchestrator requires another pass after
reviewing the returned work.

## Delegation Rules

- Start with the operating-mode question before choosing specialists.
- In `quick-fix` mode, delegate only the minimum specialist set required to
  remove uncertainty and keep the plan lightweight.
- In `full-planning` mode, use the normal specialist selection rules and canary
  validation path.
- Delegate only when the specialist can reduce orchestration cost or sharpen the
  resulting plan.
- Reuse the smallest specialist set necessary for the current stage.
- Prefer serial delegation when one specialist's output materially changes the
  next ask.
- Prefer parallel delegation only after the shared brief, ownership boundaries,
  and expected payload are stable.
- When a delegation stalls, narrow the ask or split the work instead of growing
  a catch-all follow-up.

## Validation Contract

- The planning pack must be installed globally under `~/.codex/agents/`.
- Built-in Codex subagent activity must appear whenever specialist delegation is
  actually used.
- Validation runs should follow canary order:
  1. `/plan-feature`
  2. `/plan-bugfix`
  3. `/plan-github`
- Lessons from each validation pass must be pushed into the next shared brief.
- v1 does not depend on retrieval MCPs or web research. Those are later
  efficiency optimizations, not completion requirements for this pack.
