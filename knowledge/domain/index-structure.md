---
type: Domain
title: OKF Index Structure
description: How index.md files work at the root and in each subdirectory
resource: ./templates/okf/templates/index.md
tags: [okf, index, structure, navigation, progressive-disclosure]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# OKF Index Structure

OKF uses index files at two levels to provide progressive disclosure: agents read the index first, then drill into specific concepts only when relevant.

## Root Index (`knowledge/index.md`)

The root index lists all concept groups with counts and descriptions:

```markdown
# Project Knowledge Index

> Last updated: 2026-06-29
> OKF Version: 0.1

## Concept Groups

| Group | Count | Description |
|-------|-------|-------------|
| [Architecture](./architecture/index.md) | 5 | How the system is structured |
| [Components](./components/index.md) | 12 | UI components and behavior |
| [Domain](./domain/index.md) | 8 | Business logic and domain knowledge |
| [Decisions](./decisions/index.md) | 3 | Architectural decisions and rationale |
| [Process](./process/index.md) | 4 | How workflows operate |
| [Deprecation](./deprecation/index.md) | 2 | Superseded concepts |
| [State](./state/index.md) | 1 | Current state of play |
| [Inbox](./inbox/index.md) | 3 | Items awaiting curation |

## Quick Links

- [Update Log](./log.md)
- [Knowledge Graph Viewer](./viewer.html)
- [OKF Standard](https://github.com/holovkat/designs/blob/main/templates/okf/OKF-STANDARD.md)
```

The root index also records the OKF standard version and links to the viewer and log.

## Subdirectory Index (`knowledge/<type>/index.md`)

Each subdirectory has its own `index.md` listing all concepts in that directory:

```markdown
# Architecture Concepts

| Title | Description | Tags | Status |
|-------|-------------|------|--------|
| [SpacetimeDB Tenant Model](./tenant-model.md) | Multi-tenant data isolation | [backend, spacetime-db] | active |
| [Provider Hierarchy](./provider-hierarchy.md) | LLM provider abstraction | [llm, providers] | active |
```

Each row includes: title (as a link to the concept file), description, tags, and status. This allows agents to scan the index and decide which concepts to read without opening every file.

## Inbox Index

The inbox index has a slightly different format to reflect inbox-specific fields:

```markdown
# Inbox

Session syntheses awaiting curation.

| Title | Timestamp | Tags | Issues |
|-------|-----------|------|--------|
```

## Count Accuracy

Counts in index files must match the actual number of concept files in each directory (excluding `index.md` itself). The [verification process](../process/verify-deployment.md) checks this by counting `.md` files per directory and comparing to the index.

## When Indexes Are Updated

Indexes must be updated whenever concepts are:
- **Added:** New row in the subdirectory index, incremented count in the root index.
- **Updated:** Description or tags may change; update the row.
- **Removed/moved:** Remove the row, decrement the count. If moved to `deprecation/`, add a row in the deprecation index.
- **Renamed:** Update the link path in the index.

The curation agent is responsible for keeping indexes current. See [Curation Pass](../process/curation-pass.md).

## Log File (`knowledge/log.md`)

The log records knowledge updates in reverse chronological order:

```markdown
# Knowledge Update Log

## 2026-06-29T14:00:00Z - Curation Cycle

- **Added:** `architecture/tenant-model.md`
- **Updated:** `state/current-state.md`
- **Deprecated:** `deprecation/old-routing-engine.md`
- **Processed inbox:** 3 items
```

The log tracks bundle-level evolution. Git history provides file-level diff tracking.
