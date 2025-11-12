# Workflows

This folder documents operational workflows for the FMS design. Each workflow file is a concise, review‑ready spec with diagrams and key behaviors.

## Conventions
- Diagrams: use Mermaid fenced blocks.
  - State machines: `stateDiagram-v2`
  - Process flows: `flowchart TD`
  - Sequences: `sequenceDiagram`
- Filenames: kebab‑case, domain‑prefixed (e.g., `delivery-core.md`).
- Front‑matter: include `id`, `name`, `version`, `owner`, and `status`.
- Events: list domain events the workflow consumes/emits.
- Exceptions: list known failure paths and compensations.

## Structure
- `catalog.yaml` — index of workflows with ownership and status.
- `delivery-core.md` — core delivery lifecycle workflow (initial seed).
- `templates/workflow-template.md` — copy when adding a new workflow.

## Editing and Preview
- GitHub renders Mermaid by default in Markdown.
- For local edits, the Mermaid Live Editor is helpful for quick checks.

## Adding a Workflow
1. Copy `templates/workflow-template.md` to a new file.
2. Fill in front‑matter, summary, actors, triggers, states, and exceptions.
3. Add an entry to `catalog.yaml` with `id`, `name`, `owner`, `version`, and `file`.
4. Open a short review PR; keep diagrams and text small and focused.

