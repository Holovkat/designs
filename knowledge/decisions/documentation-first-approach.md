---
type: Decision
title: Documentation-First Approach
description: Decision to make the designs repo documentation-first with README as GitHub index and HTML guide as canonical operating model
resource: ./README.md
tags: [designs, decision, documentation-first, readme, html-guide, operating-model]
timestamp: 2026-07-13T03:35:53Z
status: active
---

# Documentation-First Approach

## Decision

The designs repository is documentation-first. The README is the GitHub index. The detailed workflow meta and stage-gate guidance lives in the HTML guide under `docs/workflow-guide/`.

## Rationale

1. **No build pipeline** - This repo contains no application code, only templates and documentation. A build pipeline would add unnecessary complexity.
2. **GitHub Pages as delivery** - The rendered Pages site provides a polished, navigable experience for stakeholders without requiring a build step.
3. **README as index** - The README serves as the entry point on GitHub, linking to the rendered Pages site and the template directories.
4. **HTML guide as canonical** - The workflow guide HTML is the source of truth for the operating model, providing a richer experience than markdown alone.

## Implementation

- README links to: rendered Pages site, workflow guide, install guide, command pack, project skills, workflow installer, functional design templates, instructional documents, UI/UX guidelines
- README contains mermaid diagrams for Planning Decomposition and Delivery Lifecycle
- The HTML guide covers planning, plan review, Definition of Done ranking, T1/T2 implementation verification, T3 Dev UAT, T4 QA application readiness, CI/CD authority, production approval, T5 release verification, closeout, installation, and project-specific overlays
- Validation is lightweight: `git diff --check` and reviewing changed markdown links

## Alternatives Considered

- **Full static site generator (Docusaurus, Astro)**: Rejected as overkill for a documentation-only repo. The HTML guide is hand-crafted.
- **Markdown-only (no HTML guide)**: Rejected because the workflow guide benefits from interactive navigation, theming, and structured layout that HTML provides.
- **Wiki or external docs platform**: Rejected because the repo should be self-contained and version-controlled.

## Consequences

- The HTML guide must be maintained alongside markdown docs
- No CI/CD pipeline needed for this repo
- GitHub Pages provides free hosting
- Changes to the workflow guide require opening `docs/workflow-guide/index.html` locally to verify

## Related Concepts

- [Workflow Guide](../process/workflow-guide.md)
- [Planning Decomposition](../process/planning-decomposition.md)
- [Delivery Lifecycle](../process/delivery-lifecycle.md)
- [Templates Architecture](../architecture/templates-architecture.md)
- [Graphite Stacking for Docs](./graphite-stacking-for-docs.md)
- [Legacy Alignment Mode](./legacy-alignment-mode.md)
