---
type: Process
title: Planning Decomposition Workflow
description: Converting user requests or issues into issue-ready specifications through planning orchestrators and specialist analysis
resource: ./README.md
tags: [designs, planning, decomposition, orchestrator, requirements, workflow]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Planning Decomposition Workflow

## Overview

Planning decomposition is the process of converting user requests or existing GitHub issues into issue-ready specifications through a planning orchestrator with specialist analysis.

## Planning Entrypoints

| Entrypoint | When to Use |
|------------|-------------|
| `/plan-feature` | New feature |
| `/plan-bugfix` | Bug investigation |
| `/plan-github` | Existing issue or PR |

## Decomposition Flow

1. **Planning entrypoint** - User request or existing issue enters the pipeline
2. **Planning orchestrator** - Routes to specialist analysis
3. **Specialist analysis** (parallel or serial):
   - Requirements analysis - clarity, scope gaps, acceptance framing
   - UX and workflow analysis - operator experience, screen impact
   - Scenario and regression analysis - happy path, edge cases, exceptions
   - Technical feasibility analysis - constraints, dependencies, sequencing
4. **Issue-ready specification** - Synthesized output from specialists
5. **Plan vs Q&A review** - Validate completeness
6. **Approval** - Plan approved or gaps found (return to orchestrator)
7. **Epic or parent issue** - Created on approval
8. **Phase/sprint issue** - Decomposed from epic
9. **Task issues** - With acceptance criteria
10. **Local checklist** - Mirrors issue numbers
11. **Planning approval** - Ready for build session or needs clarification

## Mermaid Diagram

The README contains a mermaid flowchart visualizing this decomposition from "User request or existing GitHub issue" through to "Ready for build session".

## Operating Modes

The planning orchestrator infers the operating mode from the user's wording, project trajectory, and risk:
- `quick-fix`: Minimal specialist calls, narrow issue tree, smallest useful plan
- `standard`: Normal planning path with smallest specialist set needed
- `full-planning`: Full multi-agent planning flow with canary validation

## Related Concepts

- [Delivery Lifecycle](./delivery-lifecycle.md)
- [Planning Agent Contracts](./planning-agent-contracts.md)
- [Builder Agent Contracts](./builder-agent-contracts.md)
- [Implementation Checklist](./implementation-checklist.md)
- [Kickoff Requirements](./kickoff-requirements.md)
- [Workflow Guide](./workflow-guide.md)
- [GitHub Workflow Guide](./github-workflow.md)
