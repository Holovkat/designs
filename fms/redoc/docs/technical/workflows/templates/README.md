---
last-redoc-date: 2025-11-12T23:25:18Z
---
# Workflow Template Reference

This folder houses canonical scaffolding for new operational workflows. The `workflow-template.md` file captures the launch-standard sections—frontmatter with `id`, `name`, `version`, `owner`, and `status`, followed by summary, actors, triggers, state machine, main flow, event contracts, and exception handling. Keeping the template in one place ensures every workflow added to `docs/technical/workflows` starts with the same structure and metadata checklist.

Use this template when seeding a new workflow specification:
- Copy `workflow-template.md` into the workflow’s folder.
- Update the YAML frontmatter so the workflow appears correctly in catalogs and dashboards.
- Replace the placeholder Mermaid diagrams with flow-specific state and activity charts.
- Fill in Events and Exceptions so downstream integration teams inherit the explicit contract.

All Mermaid examples in the template render correctly in GitHub and in the BMAD publishing pipeline, which makes it the quickest way to produce review-ready workflow documentation.

