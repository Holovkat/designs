---
name: plan-review
description: Review planning artifacts against the Q&A/intake record before build approval.
---

Use this skill when a plan must be checked before implementation starts.

## Inputs

- Original request, Q&A notes, imported issue, or discovery record
- Epic, phase / sprint, and task issue drafts
- Local checklist mirror, if present
- Assumptions, non-goals, risks, dependencies, and evidence gates

## Process

1. Extract accepted requirements and decisions from the Q&A/intake record.
2. Map each item to the planning artifacts.
3. Check for missing scope, weak acceptance criteria, unclear ownership,
   missing evidence gates, and hidden prerequisites.
4. Rank the plan:
   - `A - Approved`
   - `B - Conditional`
   - `C - Incomplete`
   - `D - Replan`
5. Return the rank, gap list, and exact approval question if a decision is
   needed.

Do not start implementation from this skill. A failed or conditional rank goes
back to planning or owner approval.
