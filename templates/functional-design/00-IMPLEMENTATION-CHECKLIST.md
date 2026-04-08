# 00 - Implementation Checklist

This document tracks the live implementation status for the `designs` repository.

The archived template baseline is preserved in [00-TEMPLATE-IMPLEMENTATION-CHECKLIST.md](./00-TEMPLATE-IMPLEMENTATION-CHECKLIST.md).

## Sprint 1: Codex Global Planning Agent Pack

### Epic: [#1 Codex Global Planning Agent Pack](https://github.com/Holovkat/designs/issues/1)

- **Phase: [#2 Planning MVP - Global Codex Agent Pack](https://github.com/Holovkat/designs/issues/2)**
  - **Contract Gate:** Freeze role boundaries, write permissions, status vocabulary, and response payloads before any parallel specialist implementation begins.
  - **Shared Status Format:** Every delegated specialist response must include `task_id`, `owner`, `status`, `deps`, `blockers`, `next`, `eta`, and `evidence`.
  - **Living Spec Rule:** Keep constraints, non-goals, and lessons learned current in the issue hierarchy and checklist so new delegated tasks do not reconstruct context from scratch.
  - [ ] [#3](https://github.com/Holovkat/designs/issues/3) Define planning-agent contract and communication protocol
  - [ ] [#4](https://github.com/Holovkat/designs/issues/4) Create `blueprint_orchestrator` global agent
  - [ ] [#5](https://github.com/Holovkat/designs/issues/5) Create `req-analyst` and `ux-analyst` planning agents
  - [ ] [#6](https://github.com/Holovkat/designs/issues/6) Create `scenario-analyst` and `tech-analyst` planning agents
  - [ ] [#7](https://github.com/Holovkat/designs/issues/7) Create `prd-writer` planning agent
  - [ ] [#8](https://github.com/Holovkat/designs/issues/8) Validate planning command orchestration coverage
    - [ ] [#9](https://github.com/Holovkat/designs/issues/9) Validate `/plan-feature` orchestration path first as the canary integration path
    - [ ] [#10](https://github.com/Holovkat/designs/issues/10) Validate `/plan-bugfix` orchestration path
    - [ ] [#11](https://github.com/Holovkat/designs/issues/11) Validate `/plan-github` orchestration path

## Sprint 2: Codex Builder Agent Pack

### Epic: [#12 Codex Builder Agent Pack](https://github.com/Holovkat/designs/issues/12)

- **Phase: [#13 Builder MVP - Governed Task-First Build Pack](https://github.com/Holovkat/designs/issues/13)**
  - **Contract Gate:** Freeze the task packet before evaluator lanes begin, including owned files, input/output contracts, required schema, required test data, required artifacts, preload steps, fixture locations, validators, validation scope, regression surface, and line-stop conditions.
  - **Shared Status Format:** Every delegated builder lane response must include `task_id`, `owner`, `status`, `deps`, `blockers`, `next`, `eta`, and `evidence`.
  - **Warm Continuity Rule:** Reuse the same `dev` session across build, review-fix, test-fix, and compliance-fix loops for the same task.
  - **Hidden Prerequisite Rule:** Missing substantial schema, data, or artifact work line-stops back to replanning instead of expanding the warm writer loop.
  - [ ] [#14](https://github.com/Holovkat/designs/issues/14) Define builder-agent contract and task-packet schema
  - [ ] [#15](https://github.com/Holovkat/designs/issues/15) Create `builder_orchestrator` global agent
  - [ ] [#16](https://github.com/Holovkat/designs/issues/16) Create `dev` builder agent
  - [ ] [#17](https://github.com/Holovkat/designs/issues/17) Create `reviewer`, `tester`, and `compliance` builder agents
  - [ ] [#18](https://github.com/Holovkat/designs/issues/18) Integrate `start-session` builder overlay and warm task-packet runtime
  - [ ] [#19](https://github.com/Holovkat/designs/issues/19) Validate builder orchestration coverage
    - [ ] [#20](https://github.com/Holovkat/designs/issues/20) Validate task-packet freeze and prerequisite rejection
    - [ ] [#21](https://github.com/Holovkat/designs/issues/21) Validate warm `dev` correction loop
    - [ ] [#22](https://github.com/Holovkat/designs/issues/22) Validate `ready-for-integration` handoff and line-stop / replan path

## Local Validation Notes

- The orchestrator should ask whether to use `quick-fix` or `full-planning`
  before choosing a delegation depth.
- Builder canary runs should start from `/start-session` and show
  `builder_orchestrator` plus delegated builder lanes in Codex activity when
  those lanes are used.
- Missing substantial schema, test data, or artifact prerequisites should
  line-stop back to replanning instead of being absorbed into the warm `dev`
  loop.

## Exit Gates

- [ ] Planning compliance remains `>=95/100` before any checklist sign-off
- [ ] The frozen contract from [#3](https://github.com/Holovkat/designs/issues/3) is in place before any parallel specialist work begins
- [ ] Global `~/.codex/agents` planning pack is installed
- [ ] `blueprint_orchestrator` remains planning-only
- [ ] Specialist coordination uses the fixed payload `task_id`, `owner`, `status`, `deps`, `blockers`, `next`, `eta`, and `evidence`
- [ ] Constraints, non-goals, and lessons learned stay current in the living spec before new delegated work begins
- [ ] Built-in Codex activity shows specialist delegation
- [ ] The orchestrator asks how it should operate before delegating, so `quick-fix` and `full-planning` are both available
- [ ] Integration validates `/plan-feature` first, then `/plan-bugfix`, then `/plan-github`
- [ ] Lessons from each validated command path are fed into the next path instead of being relearned blindly
- [ ] Any stalled integration pass is split into narrower follow-up work instead of broadening the parent task
- [ ] Completion does not depend on retrieval MCPs or web research; those are later efficiency optimizations, not v1 requirements
- [ ] Planning handoff stops at issues plus checklist; implementation begins only on an explicit user command
- [ ] The frozen builder contract from [#14](https://github.com/Holovkat/designs/issues/14) is in place before evaluator lanes begin
- [ ] Global `~/.codex/agents` builder pack is installed
- [ ] `/start-session` remains the explicit builder entrypoint
- [ ] `builder_orchestrator` remains governance-only and does not edit implementation code
- [ ] `dev` remains the sole durable writer for code, tests, task-local fixtures, and small validation artifacts
- [ ] `reviewer`, `tester`, and `compliance` remain read-only gates
- [ ] Builder task packets explicitly declare schema, test data, artifacts, preload steps, fixture locations, validation scope, and line-stop conditions
- [ ] The same warm `dev` session is reused across correction loops for a task
- [ ] Built-in Codex activity shows builder delegation when those lanes are used
- [ ] Hidden substantial prerequisites line-stop back to replanning instead of expanding the warm writer loop
- [ ] Builder lessons learned are written back into issue and checklist state before the next loop proceeds
- [ ] Builder stops at `ready-for-integration`; UAT signoff, QA, and production promotion remain downstream flows
