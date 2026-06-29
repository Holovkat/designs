---
type: Decision
title: Per-Project Knowledge Bundles
description: Each project maintains its own knowledge/ directory in git rather than a centralised store
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, architecture, bundling, git, per-project]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Decision: Per-Project Knowledge Bundles

## Context

When designing OKF, a decision must be made about where knowledge is stored. Should each project have its own `knowledge/` directory, or should there be a centralised knowledge store that aggregates knowledge from multiple projects?

## Decision

Each project maintains its own `knowledge/` directory stored in git alongside the project's code. There is no centralised knowledge store.

## Rationale

- **Knowledge is project-specific:** Architecture decisions, domain logic, and component behaviour are unique to each project. A centralised store would mix unrelated knowledge and require complex filtering.
- **Git is canonical:** OKF's first design principle is "Git is canonical." Storing knowledge in the project repo ensures it is versioned alongside the code it describes. Changes to knowledge are reviewed in the same PRs as changes to code.
- **Co-location with code ensures relevance:** When knowledge lives next to the code, developers and agents naturally encounter it. A separate store would be forgotten or fall out of sync.
- **Simplicity:** No infrastructure is needed. No database, no server, no API. Just markdown files in a directory.
- **Access control follows repo permissions:** If a developer has access to the repo, they have access to the knowledge. No separate access management needed.
- **Branching and merging:** Knowledge can be branched and merged alongside code. Feature branches can include knowledge updates that are reviewed before merging.

## How It Works

Each project repo gets a `knowledge/` directory created by `install-okf.sh`. The directory contains:
- `index.md` - root index with concept group counts
- `log.md` - chronological update history
- `inbox/` - staging area for commit-time captures
- `architecture/`, `components/`, `domain/`, `decisions/`, `process/`, `deprecation/`, `state/` - concept directories

The entire `knowledge/` directory is committed to git. Agents read it before starting work and write to it after completing work. See [OKF Standard Spec](../architecture/okf-standard-spec.md).

## Cross-Project Knowledge

OKF does not provide a built-in mechanism for sharing knowledge across projects. If a team wants to share patterns or decisions across projects, they can:
- Create a shared "patterns" repo with its own OKF bundle.
- Reference external OKF bundles via URLs in concept `resource` fields.
- Copy relevant concepts between project bundles manually.

This is a deliberate non-feature: cross-project knowledge sharing adds complexity and is better handled by the team's existing documentation practices.

## Alternatives Considered

- **Centralised knowledge store:** A single database or repository aggregating knowledge from all projects. Rejected because knowledge is project-specific, git is canonical, and centralisation adds infrastructure and access management complexity.
- **Wiki or external system:** Use a wiki (e.g., Confluence, Notion) for project knowledge. Rejected because it violates the "git is canonical" principle and creates a dependency on external infrastructure.
- **Per-team knowledge store:** One knowledge bundle per team, shared across the team's projects. Rejected because projects within a team may have different architectures and domain logic, leading to the same mixing problem as a centralised store.
