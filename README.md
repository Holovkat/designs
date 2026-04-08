# Designs

Central workspace for reusable project-design templates, instructional documentation, and project-specific design snapshots.

## What This Repo Contains

- a reusable `templates/` library for planning new products or major features
- project-specific design folders such as `fms/`, `coder-pro/`, and `codex-pro/`
- archived zip exports kept alongside the markdown workspace

The repo is documentation-first: the main value is the structure and reuse of the templates rather than a runnable app.

## Documentation Hub

| Path | Purpose |
|------|---------|
| [`templates/index.md`](templates/index.md) | Template entrypoint and orientation guide |
| [`templates/AGENTS.md`](templates/AGENTS.md) | Conventions for maintaining the markdown template library |
| [`templates/functional-design/`](templates/functional-design/) | Core project-design documents and numbered planning flow |
| [`templates/instructional-documents/`](templates/instructional-documents/) | Workflow guides, prompts, and implementation instructions |
| [`templates/ui-ux-guidelines/`](templates/ui-ux-guidelines/) | UI/UX reference material |

## Recommended Workflow

1. Copy `templates/` into a new project-design folder.
2. Start with `templates/index.md`.
3. Use the implementation checklist in `templates/functional-design/` as the planning spine.
4. Reference `templates/instructional-documents/` for workflow, GitHub, and AI-agent guidance.

## Current Repo Structure

```text
templates/   Reusable planning and instructional documents
fms/         Project-specific design snapshot / sample workspace
coder-pro/   Project-specific design snapshot
codex-pro/   Project-specific design snapshot
*.zip        Archived exports and handoff bundles
```

## Maintenance Notes

- Treat each markdown file as a reusable briefing for a developer, PM, or AI agent.
- Prefer linking and cross-referencing over duplicating the same guidance in multiple places.
- When new standards are added, update the template library first so downstream projects inherit them.

## Validation

There is no build pipeline in this repo. The useful checks are:

- internal link review
- markdown formatting review
- `git diff --check` before committing