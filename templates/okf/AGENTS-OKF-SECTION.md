## OKF Knowledge Bundle

This project uses the [Open Knowledge Format (OKF)](https://github.com/holovkat/designs/blob/main/templates/okf/OKF-STANDARD.md) v0.1 with the warning-first `okf-core/1.0` application profile for project knowledge management. Git and repository-local Markdown/YAML remain canonical.

### Agent Onboarding

Before starting any work on this project:

1. Read `knowledge/index.md` for an overview of all concept groups.
2. Read `knowledge/state/index.md` for the current state of play.
3. Read `knowledge/deprecation/index.md` to understand what has been superseded.
4. Read concept files relevant to your work area (use tags and titles to find them).
5. Do not read everything. Use index files for progressive disclosure.

### OKF-First Protocol

The knowledge bundle is the first source of truth for this project:

1. Before investigating the codebase, query the bundle for the topic (use `knowledge/okf-query.sh <term>` when installed, or grep `knowledge/` directly).
2. Before proposing a plan, check `decisions/` and `deprecation/` for paths already taken or rejected. Cite the concept instead of re-deriving the answer.
3. If a concept looks stale (old timestamp, `resource` file changed since), verify against code before relying on it and note the staleness in your synthesis.
4. When you evaluate and reject an approach during a session, record the rejection and reason in your inbox synthesis so it becomes a curated lesson.

### Legacy Documentation

This project has existing documentation in `docs/` and `docs/design/`. OKF concepts in `knowledge/` reference these docs via the `resource` field in frontmatter. The existing docs are the source of truth for full content; OKF concepts provide a typed, searchable, curated index over them.

When a concept's `resource` field points to a doc, follow that link to the source doc for full details. The concept file provides a summary and classification; the source doc provides the complete content.

Do not move or duplicate existing docs into `knowledge/`. New knowledge that doesn't have an existing source doc is written directly as an OKF concept.

### After Completing Work

When you finish a meaningful work session:

1. Tier 1: the post-commit hook writes one compact `capture_tier: commit` inbox item for each ordinary commit. Commit bodies must state why/how and `Impact:`; Git remains the source for changed files.
2. Tier 2: at session close, `end-session` writes one `capture_tier: session` synthesis after work is committed. It references commit SHAs and contains only Decisions Made, What Was Deprecated, Lessons Learned, and Current State; it does not repeat Tier 1 captures or include a completion-summary section.
3. Capture quality checks normalize tags and compact oversized, raw-dump, malformed, or repeated low-signal bodies to a Git reference. An explicit override may retain reviewed content but cannot bypass safe structure or provenance.
4. Tier 1 and Tier 2 captures are complementary; neither replaces curation. Manual status/triage and separately requested bounded runs remain the default. A scheduled run is allowed only when a later operator decision names this exact repository and branch and installs the canonical one-session adapter, explicit limits, repository-local kill switch, no-retry ledger, and fail-closed stop policy. Never infer that authority for another repository or use a parent-workspace runner, queue, polling loop, hook launch, or unbounded Factory automation.

### Curation

The canonical curation-agent contract is staged at `.okf/agents/okf-curator.md`;
harness integration is a separate governed, operator-approved action. The
curator proposes bounded changes from explicitly selected inbox items, and the
installed runner validates and applies them:

1. A read-only status/triage report describes one exact physical Git root; it never authorizes work.
2. The operator names the full revision, selected items/hashes, context allowlist, run ID, positive item/input/generated-byte/runtime limits, `max_sessions: 1`, expected outcome, cancellation, and recovery.
3. The curator prepares one deterministic proposal covering concept outputs, affected indexes, root/inbox indexes, and `knowledge/log.md`, with expected hashes and generated provenance.
4. The runner validates root, controls, proposal, source material, and legacy preflight; acquires one lock; stages and strictly validates outputs; applies/checkpoints safe units; postflights the bundle; and only then moves a source to `inbox/processed/`.
5. Failure, cancellation, or quota exhaustion leaves input and partial output recoverable. Resume is a new explicit request using an unchanged plan; no automatic retry or quota increase is allowed.
6. The audit merges redundancy, preserves contradictions/history, fixes ambiguous references, and reports AGENTS.md alignment proposals. It never patches AGENTS.md without approval.

Run curation only through the explicit repository-scoped bounded workflow. Scheduled proposal authoring, when separately approved for this repository, is read-only, limited to one actionable item and one model session, and must pass the same check-only and execution envelope without retry. Reversible archive/compaction requires a reviewed manifest and rollback proof; permanent deletion requires separate path-specific approval.

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

- Never delete concept files. Retain superseded ones in `deprecation/`; the replacement declares the stable-ID `supersedes` relationship.
- Always update `index.md` files when adding or updating concepts.
- Always log curation actions in `log.md`.
- Use lowercase, consistent tags.
- One concept per file. Do not mix types.
- The `resource` field in frontmatter should point to the relevant code file, issue, or existing doc.
- For legacy projects, concepts reference existing docs via `resource` rather than duplicating content.
- Retained history is warning-first. New strict typed relationships use stable project-local IDs; unresolved/inferred/proposed/stale knowledge remains visible and is not silently rewritten.
- Status, lint, query, cadence, and observation commands are repository-local and read-only unless an explicit bounded mutation command is named.
- The installer may distribute an inert scheduled-curation adapter and example profile, but it never enables a schedule. No OKF command autonomously edits AGENTS.md, traverses a home/parent workspace, or mutates another repository.
