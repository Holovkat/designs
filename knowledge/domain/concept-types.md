---
type: Domain
title: OKF Concept Types
description: The 8 concept types and when to use each one
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, concepts, types, taxonomy]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# OKF Concept Types

OKF defines eight concept types, each mapping to a directory in the `knowledge/` bundle. The `type` field in frontmatter determines which directory a concept belongs to.

## Type Table

| Type | Directory | Use For |
|------|-----------|---------|
| `Architecture` | `architecture/` | How the system is structured: data models, provider hierarchy, infrastructure |
| `Component` | `components/` | UI components and their behavior: interaction patterns, HUD layouts |
| `Domain` | `domain/` | Business logic and domain knowledge: entities, workflows, rules |
| `Decision` | `decisions/` | Architectural decisions and rationale: trade-offs, why a choice was made |
| `Process` | `process/` | How workflows operate: sprint flow, deployment gates, runbooks, agent definitions |
| `Deprecation` | `deprecation/` | What was removed or superseded and why, with `supersedes` links to replacements |
| `State` | `state/` | Current state of play: what works, what is in progress, what is blocked |
| `Inbox` | `inbox/` | Staging items awaiting curation: session syntheses written at commit time |

## Choosing a Type

- **Architecture vs Component:** Architecture covers system structure and data models. Component covers UI-level behaviour and interaction patterns. If it is about how the system is built underneath, use Architecture. If it is about what the user sees and interacts with, use Component.
- **Domain vs Architecture:** Domain covers business rules, entities, and workflows. Architecture covers technical structure. If it is about the problem space, use Domain. If it is about the solution space, use Architecture.
- **Decision vs Architecture:** Decision records why a choice was made, with trade-offs and alternatives. Architecture describes what the system looks like. A concept can be both, but OKF prefers one concept per file. If the rationale is the main value, use Decision. If the structure description is the main value, use Architecture.
- **Process vs Domain:** Process describes how workflows operate (sprint flow, deployment steps). Domain describes business logic and rules. If it is about how agents or humans work, use Process. If it is about the business domain, use Domain.
- **State vs others:** State is a snapshot of the current situation. It changes frequently. Other types are more stable. There is typically one State concept per project, updated during curation passes.
- **Deprecation:** Used when a concept is superseded. The old file is moved to `deprecation/` with a `supersedes` field pointing to the replacement. Never delete a concept file; always deprecate it.
- **Inbox:** Temporary staging type. Inbox items are written by agents after sessions (before committing). They are processed by the curation agent into permanent concepts and then moved to `inbox/processed/`. See [Inbox Format](./inbox-format.md).

## Examples

| Topic | Type | Rationale |
|-------|------|-----------|
| SpacetimeDB tenant data model | Architecture | System structure, data model |
| Chat-lane UI component | Component | UI behaviour |
| Route geometry calculation rules | Domain | Business logic |
| Choice of SpacetimeDB over Postgres | Decision | Rationale and trade-offs |
| Deployment gate workflow | Process | How work flows through gates |
| Old routing engine replaced by new pipeline | Deprecation | Superseded pattern |
| Current sprint status | State | What works, in progress, blocked |
| Session synthesis from a commit | Inbox | Awaiting curation |

## Rules

- One concept per file. Do not mix types.
- The `type` field is required in frontmatter.
- Filenames should be slugified versions of the title.
- Use the correct directory for each type. The curation agent enforces this.
