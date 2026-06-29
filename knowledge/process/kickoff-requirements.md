---
type: Process
title: Kickoff Requirements Spec
description: Requirements gathering and technical specification process for creating TFD documents and technical requirement shards
resource: ./templates/instructional-documents/kickoff-requirements-spec.md
tags: [designs, kickoff, requirements, tfd, specification, sharding, planning]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Kickoff Requirements Spec

## Overview

An expert Technical Product Manager and System Architect process for gathering requirements to create a comprehensive Frontend Technical Functional Requirements Document (TFD) and break it down into actionable Technical Requirement Shards.

## Phase 1: Requirements Gathering

### Protocol

1. **One question at a time** - Never ask multiple questions in a single turn
2. **Multiple choice** - Provide numbered/lettered options, always allow "Other/Custom"
3. **No ambiguities** - If answer is vague, ask follow-up clarifying question
4. **Iterative validation** - After each section, summarize and confirm before moving on

### Lines of Questioning

1. **Project Overview** - Purpose, primary goals, target audience
2. **Technical Stack** - Framework, state management, styling, routing
3. **Design System** - Atomic design preferences, existing libraries or custom
4. **Features and Phases** - High-level features, prioritization, desired phases
5. **Navigation** - Routing structure, public vs protected routes
6. **State Management** - Server state, global state, local state strategies
7. **Integrations** - APIs, Auth, 3rd party services
8. **Non-Functional** - Performance, Accessibility, SEO, Testing

### Output

Generate the TFD file at `features/Frontend-TFD.md` or project root, using the template structure from `templates/instructional-documents/Frontend-Technical-Functional-Requirements-Document-TFD.md`.

## Phase 2: Technical Sharding

### Sharding Strategy

- **Core Infrastructure** - Create/update standard setup files (01-10) as seen in `templates/functional-design`
- **Features** - Create separate files for each major feature (11+), mapping to phases in TFD

### Naming Convention

Follow `templates/functional-design` convention:
- `00-IMPLEMENTATION-CHECKLIST.md` (Master checklist)
- `01-ARCHITECTURE-OVERVIEW.md`
- `02-FOLDER-LAYOUT.md`
- `11-FEATURE-[NAME].md`
- `12-FEATURE-[NAME].md`

### Output

Generate shard files in `features/` folder. Each shard contains:
- Feature Goal
- User Stories / Requirements
- Technical Implementation Details (Components, APIs, State)
- Verification Plan
- Update `00-IMPLEMENTATION-CHECKLIST.md` to include all generated shards

## Related Concepts

- [Planning Decomposition](./planning-decomposition.md)
- [Implementation Checklist](./implementation-checklist.md)
- [Delivery Lifecycle](./delivery-lifecycle.md)
- [Templates Architecture](../architecture/templates-architecture.md)
