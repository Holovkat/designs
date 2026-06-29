---
type: Process
title: Planning Agent Contracts
description: Codex global planning agent pack defining orchestrator, specialist roles, shared brief, and delegation rules
resource: ./templates/instructional-documents/codex-global-planning-agents.md
tags: [designs, codex, planning, agents, orchestrator, specialists, contracts, delegation]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Planning Agent Contracts

## Overview

The v1 planning pack installed under `~/.codex/agents/` defines the source-of-truth contract for global planning agents used by `/plan-feature`, `/plan-bugfix`, and `/plan-github`.

## Goals

- Keep planning orchestration separate from implementation work
- Push lower-cost analysis into specialist agents
- Reduce context repetition through a condensed shared brief
- Keep delegated work observable through Codex subagent activity

## Agent Roster

| Agent | Sandbox | Responsibility | Final Publisher |
|-------|---------|---------------|-----------------|
| blueprint_orchestrator | workspace-write | Interview, delegate, synthesize, publish GitHub planning artifacts | Yes |
| req-analyst | read-only | Requirement clarity, scope gaps, acceptance framing | No |
| ux-analyst | read-only | Workflow, operator experience, screen impact | No |
| scenario-analyst | read-only | Happy path, edge cases, regression scenarios | No |
| tech-analyst | read-only | Constraints, dependencies, sequencing risks | No |
| prd-writer | read-only | Draft issue-ready blueprint sections, acceptance criteria | No |

## Operating Modes

- `quick-fix`: minimize specialist calls, keep issue tree narrow
- `standard`: normal planning path with smallest specialist set
- `full-planning`: full multi-agent flow with canary validation

Confidence policy: High = proceed; Medium = proceed with named assumptions; Low = ask one focused question.

## Ownership Boundaries

- `blueprint_orchestrator` is planning-only. May create/edit planning issues and checklist, but not implementation code.
- Specialists are read-only. They report findings, may not publish issues, edit checklist, or code.
- Planning handoff stops at GitHub issues plus checklist updates.

## Shared Brief Fields

`planning_command`, `goal`, `inferred_intent`, `confidence`, `project_trajectory`, `active_vectors`, `current_scope`, `constraints`, `non_goals`, `references`, `lessons_learned`, `open_questions`, `expected_output`.

## Communication Protocol

Orchestrator-mediated (no direct peer-to-peer):
1. Orchestrator decides if specialist is needed
2. Delegates with shared brief and clear ask
3. Specialists return fixed payload
4. Orchestrator relays blockers/questions into later delegations

### Specialist Payload

Every response must include: `task_id`, `owner`, `status`, `deps`, `blockers`, `next`, `eta`, `evidence`.

### Status Lifecycle

`queued -> claimed -> working -> blocked | ready -> done`

## Delegation Rules

- Infer operating mode and confidence before choosing specialists
- Reuse smallest specialist set necessary
- Prefer serial delegation when output changes next ask
- Prefer parallel delegation only when brief and payload are stable
- When stalled, narrow the ask or split work

## Validation Contract

- Canary order: `/plan-feature` -> `/plan-bugfix` -> `/plan-github`
- Lessons from each pass feed into next shared brief
- v1 does not depend on retrieval MCPs or web research

## Related Concepts

- [Builder Agent Contracts](./builder-agent-contracts.md)
- [Planning Decomposition](./planning-decomposition.md)
- [Agent Generation](./agent-generation.md)
- [Implementation Checklist](./implementation-checklist.md)
- [Delivery Lifecycle](./delivery-lifecycle.md)
