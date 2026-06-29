---
type: Process
title: Delivery Lifecycle
description: Governed delivery lifecycle from planning approval through implementation, compliance, QA/UAT, production approval, and closeout
resource: ./README.md
tags: [designs, delivery, lifecycle, governance, qa, uat, production, closeout]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Delivery Lifecycle

## Overview

The delivery lifecycle governs the flow from planning approval to closeout, with stage gates for compliance, QA/UAT, and production approval.

## Lifecycle Stages

1. **Planning approved** - Entry point into the governed build session
2. **Start governed build session** - Create isolated worktree context
3. **Freeze task packet** - Lock down requirements, contracts, and acceptance criteria
4. **Implementation** - Write code, tests, fixtures
5. **Review, tests, compliance** - Quality gates run
6. **Compliance and DoD review** - Definition of Done ranking
7. **DoD rank passes?** - Gate: No -> back to implementation; Conditional -> owner accepts caveats; Yes -> proceed
8. **Project-defined CI/CD authority** - Build validation
9. **QA readiness manifest** - Prepared for QA
10. **QA/UAT approved?** - Gate: No -> rework/replan; Yes -> proceed
11. **Production approval gate** - Owner approves promotion
12. **Owner approved promotion?** - Gate: No -> stays at gate; Yes -> proceed
13. **Governed production promotion** - Deploy to production
14. **Production smoke** - Post-deployment verification
15. **Final signoff?** - Gate: No -> rework/replan; Yes -> proceed
16. **Closeout and lessons learned** - Document and archive

## Stage Gates

| Gate | Decision Point | Failure Path |
|------|---------------|--------------|
| DoD rank | Pass / Conditional / No | No -> implementation; Conditional -> owner decision |
| QA/UAT | Approved / Not approved | Not approved -> rework or replan |
| Production approval | Owner approved / Not | Not -> stays at gate |
| Final signoff | Pass / Fail | Fail -> rework or replan |

## Key Principles

- Implementation can loop back from any quality gate
- Owner acceptance is required for conditional DoD passes
- Production promotion is explicitly governed, not automatic
- Closeout captures lessons learned for future cycles

## Mermaid Diagram

The README contains a mermaid flowchart visualizing this lifecycle from "Planning approved" through to "Closeout and lessons learned".

## Related Concepts

- [Planning Decomposition](./planning-decomposition.md)
- [Builder Agent Contracts](./builder-agent-contracts.md)
- [Closeout Process](./closeout-process.md)
- [Implementation Checklist](./implementation-checklist.md)
- [Workflow Guide](./workflow-guide.md)
- [Deployment Guide](./deployment-guide.md)
