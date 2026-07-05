---
type: Process
title: Deploy OKF to a Project
description: Full 8-phase deployment workflow from mechanical install to final verification
resource: ./templates/okf/DEPLOYMENT-RUNBOOK.md
tags: [okf, deployment, runbook, install, workflow]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Deploy OKF to a Project

The OKF deployment runbook defines an 8-phase workflow that any agent can follow to deploy OKF to a project consistently. The full runbook is at `./templates/okf/DEPLOYMENT-RUNBOOK.md`.

## Prerequisites

- The project must be a git repository.
- `designs/templates/okf/` must be available (the OKF template source).
- The agent must have read access to the project's existing docs, GitHub issues, and source code.
- `gh` CLI must be available if the project has GitHub issues/epics.

## Phase 1: Mechanical Install

Run the installer script to create the knowledge directory structure, copy the viewer, generator, and query helper, install the post-commit hook, install the okf-curator droid to `.factory/droids/`, and update AGENTS.md. See [Installer Design](../architecture/installer-design.md).

```bash
bash <path-to-designs>/templates/okf/install-okf.sh <project-root>
```

Verify: `knowledge/index.md` exists, `knowledge/log.md` exists, `knowledge/okf-query.sh` is executable, `.githooks/post-commit` is executable, `git config core.hooksPath` returns `.githooks`, `.factory/droids/okf-curator.md` exists.

## Phase 2: Seed From Existing Docs

Read the project's existing documentation (AGENTS.md, docs/, docs/design/, docs/agents/, README.md) and create OKF concepts for each significant topic. This establishes the knowledge baseline. See [Seed From Existing Docs](./seed-from-existing-docs.md).

## Phase 3: Process GitHub Epics

List closed epics with `gh issue list --label epic --state closed`, fetch each epic body, and create Process/Domain concepts for recent epics or Deprecation entries for older ones. See [Process GitHub Epics](./process-github-epics.md).

## Phase 4: Create Schema Diagrams

If the project has a database schema, create mermaid ER diagram concepts grouped by domain. See [Create Schema Diagrams](./create-schema-diagrams.md).

## Phase 5: Migrate AGENTS.md

Update the project's AGENTS.md to replace AFFiNE/docs references with OKF references, add the OKF Knowledge Bundle section, and add legacy documentation alignment. See [Migrate AGENTS.md](./migrate-agents-md.md).

## Phase 6: Curation Pass

Read all concepts, add cross-links, check for duplicates, check for missing concepts, move superseded to deprecation, run the audit (redundancy, contradictions, ambiguous references, AGENTS.md alignment), verify index counts, update log.md and state. See [Curation Pass](./curation-pass.md) and [Curation Audit and Nudge](../decisions/curation-audit-and-nudge.md).

## Phase 7: Generate Viewer

Generate the self-contained viz.html:

```bash
node <project-root>/knowledge/generate-viz.js <project-root>/knowledge
```

Verify the browse tab, graph tab, mermaid rendering, link navigation, and search filtering all work. See [Viz Generator Design](../architecture/viz-generator-design.md).

## Phase 8: Final Verification

Count concepts per directory and verify index counts match. Verify no AFFiNE references in AGENTS.md. Verify no docs/agents/ references in AGENTS.md. Verify the OKF Knowledge Bundle section exists. Verify the post-commit hook is installed. Verify viz.html exists. See [Verify Deployment](./verify-deployment.md).

## Post-Deployment

After deployment, the project is ready for ongoing OKF usage:
- Agents read `knowledge/` concepts before starting work (OKF-first protocol).
- Agents write session syntheses to `knowledge/inbox/` before committing.
- The post-commit hook refreshes the viewer manifest and nudges for curation when the inbox reaches the threshold (default 5).
- The okf-curator droid processes inbox items into permanent concepts and audits the bundle.
- `viz.html` can be regenerated after any knowledge changes.
- `knowledge/okf-query.sh` provides portable concept search.
