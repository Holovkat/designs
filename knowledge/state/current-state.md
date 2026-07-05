---
type: State
title: OKF System Current State
description: Current state of the OKF system including all components, tooling, protocols, and deployments
resource: ./templates/okf/OKF-STANDARD.md
tags: [okf, state, status, v0.1, okf-first, curation-audit]
timestamp: 2026-07-05T13:00:00Z
status: active
---

# OKF System Current State

## Version

OKF Standard v0.1. The standard is defined in `OKF-STANDARD.md` and deployed via the `DEPLOYMENT-RUNBOOK.md`.

## What Works

### Core Standard
- OKF Standard v0.1 specification is complete: directory structure, concept types, frontmatter schema, inbox format, index format, log format, curation rules (7 phases including Phase 6 Audit), legacy alignment mode, OKF-first protocol, agent onboarding.
- 8 concept types defined: Architecture, Component, Domain, Decision, Process, Deprecation, State, Inbox.

### Tooling
- **install-okf.sh:** Installer script that creates the knowledge directory structure, copies viewer, generator, and query helper, installs the post-commit hook to `.githooks/`, installs the okf-curator droid to `.factory/droids/` (and `.claude/agents/` when present), sets local `core.hooksPath`, and appends the OKF section to AGENTS.md.
- **post-commit.sh:** Manifest-refresh and curation nudge hook. Does NOT write to the inbox. Refreshes the workspace viewer manifest and nudges for curation when unprocessed inbox items reach a configurable threshold (default 5). See [Hook System](../architecture/hook-system.md).
- **generate-viz.js:** Node.js script that reads all `.md` concept files and embeds them as JSON into `viewer.html` to produce a self-contained `viz.html`.
- **viewer.html:** Single-file HTML viewer with two tabs (Browse with folder tree + detail, Graph with Cytoscape.js), mermaid.js rendering, link interception, search filtering, and drag-and-drop folder loading.
- **okf-query.sh:** Portable grep-based concept search tool with frontmatter ranking and a `--decisions` scope for prior and rejected paths. Installed to `knowledge/okf-query.sh`. See [OKF Query Helper](../architecture/okf-query-helper.md).
- **okf.ts:** Pi extension providing `/okf-status`, `/okf-query`, `/okf-capture`, `/okf-curate`, and `/okf-init` commands.
- **SKILL.md:** Agent skill definition for working with OKF bundles, including onboarding, OKF-first protocol, inbox writing, and curation instructions. Distributed via agent-skill-distro. See [Workflow Skill Canonicalisation](../decisions/skill-canonicalisation.md).
- **okf-curator droid:** Dedicated curation agent (canonical contract at `templates/okf/agents/okf-curator.md`) that processes inbox items into permanent concept files, fetches GitHub issues for context, and audits the bundle for redundancy, contradictions, ambiguous references, and AGENTS.md alignment. See [Curation Audit and Nudge](../decisions/curation-audit-and-nudge.md).

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

## Protocols and Decisions

- [OKF-First Protocol](../decisions/okf-first-protocol.md): Knowledge bundle is the first source of truth; query before investigating, check decisions and deprecation before planning.
- [Curation Audit and Nudge](../decisions/curation-audit-and-nudge.md): Phase 6 Audit (redundancy, contradictions, ambiguous refs, AGENTS.md alignment) runs on every curation pass; passive nudge at threshold 5.
- [Workflow Skill Canonicalisation](../decisions/skill-canonicalisation.md): Designs repo is canonical source for workflow skills; three-layer distribution via agent-skill-distro.

## What Is Blocked

- Nothing currently blocked.

## Component Status Summary

| Component | Status | Location |
|-----------|--------|----------|
| OKF Standard v0.1 | Complete | `templates/okf/OKF-STANDARD.md` |
| Deployment Runbook | Complete | `templates/okf/DEPLOYMENT-RUNBOOK.md` |
| Installer | Complete | `templates/okf/install-okf.sh` |
| Post-commit Hook | Complete (manifest + nudge) | `templates/okf/post-commit.sh` |
| Viz Generator | Complete | `templates/okf/generate-viz.js` |
| Viewer | Complete | `templates/okf/viewer.html` |
| Query Helper | Complete | `templates/okf/okf-query.sh` |
| Pi Extension | Complete | `pi-extensions/extensions/okf.ts` |
| Agent Skill | Complete | `pi-extensions/skills/okf/SKILL.md` |
| Curator Droid | Complete | `templates/okf/agents/okf-curator.md` |
| AGENTS Section Template | Complete | `templates/okf/AGENTS-OKF-SECTION.md` |
| fms-glm deployment | Deployed (144 concepts) | `fms-glm/knowledge/` |
| Self-knowledge bundle | Deployed (this bundle) | `designs/knowledge/` |

## Key Decisions

- [Legacy Alignment Mode](../decisions/legacy-alignment-mode.md): Existing docs stay in place; OKF concepts reference them.
- [Post-Commit Capture Model](../decisions/post-commit-capture-model.md): Agents write syntheses before committing; hook refreshes manifest and nudges; curation is separate.
- [Per-Project Bundles](../decisions/per-project-bundles.md): Each project has its own knowledge/ directory in git.
- [OKF-First Protocol](../decisions/okf-first-protocol.md): Knowledge bundle is the first source of truth; query before investigating.
- [Curation Audit and Nudge](../decisions/curation-audit-and-nudge.md): Phase 6 Audit on every pass; passive nudge at threshold 5.
- [Workflow Skill Canonicalisation](../decisions/skill-canonicalisation.md): Designs is canonical source; three-layer distribution via agent-skill-distro.
