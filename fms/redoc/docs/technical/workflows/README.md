---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Operational Workflows

The `docs/technical/workflows` collection documents every operational workflow that underpins the FMS launch scope. Each workflow follows the same authoring pattern: YAML frontmatter for ownership and status, summary prose, Mermaid diagrams for states and flows, an explicit event contract, and enumerated exception handling. This keeps the reverse-tree documentation pipeline aligned with BMAD conventions.

## Structure
- `delivery-core.md` describes the end-to-end delivery lifecycle, including the dispatcher/driver/customer actors, state transitions, and events emitted back into Convex and partner systems.
- `catalog.yaml` is the authoritative index for workflows. It lists workflow IDs, owners, tags, and file references so agents and CI jobs can auto-discover coverage.
- `templates/workflow-template.md` (documented separately) is the scaffolding for authoring additional workflows with consistent metadata, diagrams, and exception sections.

## Usage
- When authoring or updating a workflow, copy the template, fill in frontmatter, and register the workflow inside `catalog.yaml`.
- Keep Mermaid diagrams small and reviewable—state machines for lifecycle, flowcharts for the happy path, and any additional diagrams in context.
- Highlight how the workflow consumes/emits events so integration specs (`docs/integrations/*`) stay synchronized.

Because each workflow is versioned and tagged, ReDoc surfaces only the distinctive elements of a workflow here; standard BMAD guidance (diagram conventions, naming, etc.) lives in the BMAD convention references already loaded for this run.

