---
type: State
title: OKF System Current State
description: Current state of the OKF system as of v0.1 including all components and deployments
resource: ./templates/okf/
tags: [okf, state, status, v0.1]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# OKF System Current State

## Version

OKF Standard v0.1. The standard is defined in `OKF-STANDARD.md` and deployed via the `DEPLOYMENT-RUNBOOK.md`.

## What Works

### Core Standard
- OKF Standard v0.1 specification is complete: directory structure, concept types, frontmatter schema, inbox format, index format, log format, curation rules, legacy alignment mode, agent onboarding.
- 8 concept types defined: Architecture, Component, Domain, Decision, Process, Deprecation, State, Inbox.

### Tooling
- **install-okf.sh:** Installer script that creates the knowledge directory structure, copies viewer and generator, installs the post-commit hook to `.githooks/`, sets local `core.hooksPath`, and appends the OKF section to AGENTS.md.
- **post-commit.sh:** Lightweight commit metadata capture hook that writes to `knowledge/inbox/`. Handles edge cases (no knowledge dir, gitignored, duplicates).
- **generate-viz.js:** Node.js script that reads all `.md` concept files and embeds them as JSON into `viewer.html` to produce a self-contained `viz.html`.
- **viewer.html:** Single-file HTML viewer with two tabs (Browse with folder tree + detail, Graph with Cytoscape.js), mermaid.js rendering, link interception, search filtering, and drag-and-drop folder loading.
- **okf.ts:** Pi extension providing `/okf-status`, `/okf-query`, `/okf-capture`, `/okf-curate`, and `/okf-init` commands.
- **SKILL.md:** Agent skill definition for working with OKF bundles, including onboarding, inbox writing, and curation instructions.
- **okf-curator droid:** Dedicated curation agent that processes inbox items into permanent concept files, fetching GitHub issues for context.

### Documentation
- **OKF-STANDARD.md:** The complete standard specification.
- **DEPLOYMENT-RUNBOOK.md:** 8-phase deployment workflow.
- **AGENTS-OKF-SECTION.md:** Template for the AGENTS.md OKF section.
- **Template index files:** Templates for root index, subdirectory indexes, log, and inbox index.

### Deployments
- **fms-glm:** OKF deployed with 144 concepts. This is the primary production deployment.
- **designs/ (this bundle):** OKF system's own self-knowledge bundle, documenting how OKF works and how to deploy it.

## What Is In Progress

- Broader adoption across additional projects.
- Refinement of curation workflows based on usage feedback.
- Potential enhancements to the viewer (additional graph layouts, export features).

## What Is Blocked

- Nothing currently blocked.

## Component Status Summary

| Component | Status | Location |
|-----------|--------|----------|
| OKF Standard v0.1 | Complete | `templates/okf/OKF-STANDARD.md` |
| Deployment Runbook | Complete | `templates/okf/DEPLOYMENT-RUNBOOK.md` |
| Installer | Complete | `templates/okf/install-okf.sh` |
| Post-commit Hook | Complete | `templates/okf/post-commit.sh` |
| Viz Generator | Complete | `templates/okf/generate-viz.js` |
| Viewer | Complete | `templates/okf/viewer.html` |
| Pi Extension | Complete | `pi-extensions/extensions/okf.ts` |
| Agent Skill | Complete | `pi-extensions/skills/okf/SKILL.md` |
| Curator Droid | Complete | `pi-extensions/.factory/droids/okf-curator.md` |
| AGENTS Section Template | Complete | `templates/okf/AGENTS-OKF-SECTION.md` |
| fms-glm deployment | Deployed (144 concepts) | `fms-glm/knowledge/` |
| Self-knowledge bundle | Deployed (this bundle) | `designs/knowledge/` |

## Key Decisions

- [Legacy Alignment Mode](../decisions/legacy-alignment-mode.md): Existing docs stay in place; OKF concepts reference them.
- [Post-Commit Capture Model](../decisions/post-commit-capture-model.md): Lightweight hook writes to inbox; curation is separate.
- [Per-Project Bundles](../decisions/per-project-bundles.md): Each project has its own knowledge/ directory in git.
