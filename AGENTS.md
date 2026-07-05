# Designs

Documentation-first repository containing reusable project-design templates, agent workflow commands, project-local skills, and delivery operating model guidance. Also home to the Open Knowledge Format (OKF) system, distributed from `templates/okf/`.

## Key Areas

| Area | Path | Description |
|------|------|-------------|
| OKF System | `templates/okf/` | OKF standard, viewer, installer, hook, deployment runbook |
| OKF Knowledge | `knowledge/` | Self-documenting OKF knowledge bundle (54 concepts) |
| Instructional Documents | `templates/instructional-documents/` | Commands, skills, hooks, scripts, workflow references |
| Functional Design | `templates/functional-design/` | Implementation checklist templates |
| UI/UX Guidelines | `templates/ui-ux-guidelines/` | Design tokens, component/form/layout patterns |
| Design Standard | `design-standard-v01/` | DESIGN.md format spec and examples |
| Workflow Guide | `docs/workflow-guide/` | HTML operating guide for planning, approvals, CI/CD, QA |
| Templates AGENTS | `templates/AGENTS.md` | Templates area agent instructions |

## OKF Deployment

To deploy OKF to another project, read `knowledge/process/deploy-okf.md` and follow `templates/okf/DEPLOYMENT-RUNBOOK.md`. The SKILL.md at `templates/instructional-documents/skills/okf/SKILL.md` (canonical source, distributed via agent-skill-distro to CLI skill roots) provides agent-facing instructions.

## OKF Knowledge Bundle

This project uses the [Open Knowledge Format (OKF)](https://github.com/holovkat/designs/blob/main/templates/okf/OKF-STANDARD.md) v0.1 for project knowledge management.

### Agent Onboarding

Before starting any work on this project:

1. Read `knowledge/index.md` for an overview of all concept groups.
2. Read `knowledge/state/index.md` for the current state of play.
3. Read `knowledge/deprecation/index.md` to understand what has been superseded.
4. Read concept files relevant to your work area (use tags and titles to find them).
5. Do not read everything. Use index files for progressive disclosure.

### OKF-First Protocol

The knowledge bundle is the first source of truth for this project:

1. Before investigating the codebase, query the bundle for the topic (grep `knowledge/` by title, tags, and body).
2. Before proposing a plan, check `decisions/` and `deprecation/` for paths already taken or rejected. Cite the concept instead of re-deriving the answer.
3. If a concept looks stale (old timestamp, `resource` file changed since), verify against code before relying on it and note the staleness in your synthesis.
4. When you evaluate and reject an approach during a session, record the rejection and reason in your inbox synthesis so it becomes a curated lesson.

### Legacy Documentation

This project has existing documentation in `templates/instructional-documents/`, `templates/functional-design/`, `templates/ui-ux-guidelines/`, `docs/workflow-guide/`, and `design-standard-v01/`. OKF concepts in `knowledge/` reference these docs via the `resource` field in frontmatter. The existing docs remain as detailed references; OKF concepts provide a typed, searchable, curated index over them.

When a concept's `resource` field points to a doc, follow that link to the source doc for full details. The concept file provides a summary and classification; the source doc provides the complete content.

Do not move or duplicate existing docs into `knowledge/`. New knowledge that doesn't have an existing source doc is written directly as an OKF concept.

### After Completing Work

When you finish a meaningful work session:

1. Write a session synthesis to `knowledge/inbox/` using the OKF inbox format, before committing.
2. Include: what was done, decisions made, approaches rejected and why, what was deprecated, lessons learned, current state.
3. This is about the product, business logic, and application state, not just code diffs.
4. The post-commit hook does not write inbox items for you; it refreshes the viewer manifest and nudges when the inbox needs curation.

### Curation

The curation agent (`okf-curator`, canonical contract at `templates/okf/agents/okf-curator.md`) processes inbox items into permanent concept files:

1. Reads all unprocessed inbox items plus existing concepts and codebase context.
2. Creates or updates concept files in the appropriate directory.
3. Moves superseded concepts to `knowledge/deprecation/`.
4. Audits the bundle: merges redundant concepts, resolves contradictions, fixes ambiguous references, and reports AGENTS.md alignment proposals (applied only on approval).
5. Updates all `index.md` files and `knowledge/log.md`.

Run curation when the post-commit hook reports 5 or more unprocessed inbox items, or after any significant epic closes.

### Concept Types

| Type | Directory | Use For |
|------|-----------|---------|
| Architecture | `architecture/` | System structure, data models, infrastructure |
| Component | `components/` | UI components, interaction patterns |
| Domain | `domain/` | Business logic, domain entities, rules |
| Decision | `decisions/` | Architectural decisions and rationale |
| Process | `process/` | Workflows, sprint flow, deployment gates |
| Deprecation | `deprecation/` | Superseded patterns |
| State | `state/` | Current state of play |

### Rules

- Never delete concept files. Move superseded ones to `deprecation/` instead.
- Always update `index.md` files when adding or updating concepts.
- Always log curation actions in `log.md`.
- Use lowercase, consistent tags.
- One concept per file. Do not mix types.
- The `resource` field in frontmatter should point to the relevant code file, issue, or existing doc.
- For legacy projects, concepts reference existing docs via `resource` rather than duplicating content.
