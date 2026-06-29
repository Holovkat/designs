---
type: Process
title: Implementation Checklist
description: Functional design implementation checklist template with phased steps from architecture overview through deployment strategy
resource: ./templates/functional-design/00-TEMPLATE-IMPLEMENTATION-CHECKLIST.md
tags: [designs, implementation, checklist, functional-design, sprints, tracking]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Implementation Checklist

## Overview

The implementation checklist tracks the implementation status of a project's epics and features, organized into sprints. It should be updated as new design documents are created.

## Template Structure

### Sprint 1: Foundational Setup and User Onboarding

Core infrastructure phase with tasks mapped to numbered design documents:

| Doc | Topic |
|-----|-------|
| 01-ARCHITECTURE-OVERVIEW.md | Architecture overview |
| 02-FOLDER-LAYOUT.md | Folder layout |
| 03-SETTINGS-AND-CONFIG.md | Settings and config |
| 04-WEB-UI-SETUP.md | Web UI setup |
| 05-DATABASE-SETUP.md | Database setup |
| 06-AUTHENTICATION-SETUP.md | Authentication setup |
| 07-API-INTEGRATION.md | API integration strategy |
| 08-INFRASTRUCTURE-SETUP.md | Infrastructure and containerization |
| 09-VERSION-CONTROL-STRATEGY.md | Version control |
| 10-CI-CD-PIPELINE.md | CI/CD pipeline |

Feature phases (11+) follow, each with Design, Implementation, and Verification sub-tasks.

### Post-Release Tasks

- 98-TESTING-AND-VERIFICATION.md - Testing and verification
- 99-DEPLOYMENT-STRATEGY.md - Deployment

## Live vs Template

The designs repo maintains two versions:
- **00-TEMPLATE-IMPLEMENTATION-CHECKLIST.md** - Archived template baseline
- **00-IMPLEMENTATION-CHECKLIST.md** - Live implementation status for the designs repo itself

## Live Repo Checklist

The live checklist tracks the Codex Global Planning Agent Pack and Codex Builder Agent Pack sprints with GitHub issue references, contract gates, shared status formats, and exit gates.

### Exit Gates Include

- Planning compliance >= 95/100 before sign-off
- Frozen contract in place before parallel work
- Global `~/.codex/agents` packs installed
- Orchestrators remain governance-only
- Specialists use fixed payload format
- Built-in Codex activity shows delegation
- Builder stops at `ready-for-integration`

## Related Concepts

- [Kickoff Requirements](./kickoff-requirements.md)
- [Planning Decomposition](./planning-decomposition.md)
- [Delivery Lifecycle](./delivery-lifecycle.md)
- [Planning Agent Contracts](./planning-agent-contracts.md)
- [Builder Agent Contracts](./builder-agent-contracts.md)
- [Templates Architecture](../architecture/templates-architecture.md)
