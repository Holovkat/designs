---
type: Process
title: Delivery Lifecycle
description: Efficient staged delivery from approved planning through targeted development checks, sprint checkpoints, Dev UAT, full QA application readiness, release approval, and closeout
resource: ./README.md
tags: [designs, delivery, lifecycle, governance, verification, dev-uat, qa, regression, production, closeout]
timestamp: 2026-07-13T03:35:53Z
status: active
---

# Delivery Lifecycle

## Overview

The lifecycle keeps implementation fast by scaling verification at coherent boundaries. Changed behavior receives tests during development; affected subsystems are checked at sprint checkpoints; completed sprint or epic functionality is accepted in Dev; full application regression runs after approved deployment to canonical QA.

## Lifecycle Stages

1. **Planning approved** - Enter the governed build session with authoritative epic and sprint acceptance criteria.
2. **Freeze task packet** - Lock the current task scope, contracts, risks, and evidence expectations.
3. **T1 Development** - Implement the smallest clean change, add or update tests for changed behavior, and run targeted checks plus the narrowest relevant analyzer or build check.
4. **T2 Sprint checkpoint** - After a coherent dependency or phase batch, run affected-subsystem checks and one combined code/specification review.
5. **Compliance and DoD review** - Rank delivered scope and resolve missing requirements or accepted caveats.
6. **T3 Dev UAT** - Validate the completed sprint or epic journeys, acceptance criteria, material failure paths, and relevant integration boundaries in canonical Dev.
7. **Dev functionality accepted?** - Failure returns scoped evidence to implementation; success authorizes the governed QA path.
8. **Project-defined QA deployment authority** - Produce the canonical QA build through the project-governed workflow.
9. **T4 QA application readiness** - Run the full repository-required suite and end-to-end regression across applicable integrations, roles, supported devices, persistence/offline behavior, migrations, and operational failure paths.
10. **QA application ready?** - Failure returns reproduction evidence for rework; success proceeds to explicit owner approval.
11. **Production approval gate** - The owner names the production target and authorized release scope.
12. **Governed production promotion** - Move the approved artifact through the project-defined path.
13. **T5 Release verification** - Confirm active release vectors, artifact identity, canonical environment, and post-deployment smoke scenarios.
14. **Final signoff and closeout** - Record evidence, residual risk, cleanup, documentation, and lessons learned.

## Stage Gates

| Gate | Decision point | Failure path |
| --- | --- | --- |
| T1 changed behavior | Targeted checks pass / fail | Fix the current change before advancing |
| T2 sprint checkpoint | Affected subsystem coherent / not coherent | Return the batch for scoped rework |
| DoD rank | Pass / conditional / fail | Conditional requires owner decision; failure returns to implementation |
| T3 Dev UAT | Sprint or epic functionality accepted / rejected | Return changed flows and reproduction evidence |
| T4 QA readiness | Full application regression passes / fails | Rework or replan, then repeat QA readiness |
| Production approval | Explicitly approved / not approved | Stay at the gate |
| T5 final signoff | Pass / fail | Rework, rollback, or replan through the governed path |

## Key Principles

- Do not run whole-application regression after every minor edit.
- Do not defer tests for changed behavior until the end of the epic.
- Dev UAT proves delivered functionality; QA proves application readiness.
- High-risk changes may widen an earlier gate around the affected risk.
- Evidence and completion language must name the highest stage actually proven.
- Production promotion remains explicitly governed and never follows automatically from passing tests.

## Related Concepts

- [Planning Decomposition](./planning-decomposition.md)
- [Builder Agent Contracts](./builder-agent-contracts.md)
- [Closeout Process](./closeout-process.md)
- [Implementation Checklist](./implementation-checklist.md)
- [Workflow Guide](./workflow-guide.md)
- [Skill Distribution Sync](./skill-distribution-sync.md)
