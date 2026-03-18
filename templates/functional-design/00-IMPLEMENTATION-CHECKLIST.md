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

## Local Validation Notes

- The orchestrator should ask whether to use `quick-fix` or `full-planning`
  before choosing a delegation depth.

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
