---
type: Process
title: Process GitHub Epics
description: How to convert closed GitHub epics into OKF knowledge entries
resource: ./templates/okf/DEPLOYMENT-RUNBOOK.md
tags: [okf, github, epics, issues, gh-cli]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Process GitHub Epics

Phase 3 of the OKF deployment workflow. Closed GitHub epics contain rich context (pre-approved directives, acceptance criteria, linked issues, reasoning) that should be captured as knowledge concepts.

## Step 1: List Closed Epics

```bash
gh issue list --label epic --state closed --limit 100 --json number,title,closedAt
```

This returns a JSON array of closed epics with their number, title, and closure date.

## Step 2: Fetch Each Epic Body

```bash
gh issue view <number> --json body,title,labels,closedAt
```

Fetch the full issue body for each epic. The body typically contains the epic's scope, acceptance criteria, implementation notes, and outcome summary.

## Step 3: Create Concept Entries

### Recent Epics (Last 3-6 Months)

Create full Process or Domain concepts describing:
- What was built
- The outcome and current state
- Key decisions made during the epic
- Acceptance criteria and whether they were met

Include `issue_refs` in frontmatter to link back to the GitHub issue:

```yaml
---
type: Process
title: Route Geometry Pipeline
description: Epic #1495 - replaced old routing engine with geometry-based pipeline
resource: ./docs/design/ROUTE-GEOMETRY.md
tags: [routing, geometry, pipeline, epic]
timestamp: 2026-06-29T14:30:00Z
status: active
issue_refs: [1495]
---
```

### Older Epics

Create Deprecation entries with reasoning. These record what was built and why it was superseded or removed:

```yaml
---
type: Deprecation
title: Old Routing Engine
description: Epic #1200 - superseded by geometry-based pipeline in epic #1495
resource: ./docs/design/OLD-ROUTING.md
tags: [routing, deprecated, epic]
timestamp: 2026-03-15T10:00:00Z
status: deprecated
supersedes: [route-geometry-pipeline.md]
issue_refs: [1200]
---
```

Include `issue_refs` and `supersedes` where applicable.

## Step 4: Update Indexes and Log

After creating all epic concepts:
- Update `index.md` files in the relevant directories with new concept rows.
- Update the root `index.md` with accurate counts.
- Update `knowledge/log.md` with an epic processing entry.

## Enrichment During Curation

The curation agent also fetches GitHub issues referenced by `issue_refs` in inbox item frontmatter. During a [curation pass](./curation-pass.md), the agent uses `gh issue view <number> --json body,title,labels,closedAt` to enrich concepts with full issue context. Issues contain pre-approved directives, acceptance criteria, linked epics, and full reasoning that goes beyond commit messages.

## Relationship to Other Phases

This phase runs after [Seed From Existing Docs](./seed-from-existing-docs.md) (Phase 2) and before [Curation Pass](./curation-pass.md) (Phase 6). The epic concepts are integrated into the knowledge base and cross-linked during the curation pass.
