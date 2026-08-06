---
name: okf
description: >
  Open Knowledge Format (OKF) agent onboarding, inbox writing, curation, and deployment guidance.
  Use when working on a project that has a knowledge/ OKF bundle, when initializing one, when
  curating inbox items into concepts, or when deploying OKF to a new project. Triggers on OKF,
  knowledge bundle, knowledge base, session synthesis, inbox curation, curate knowledge, or
  deploy OKF.
---

# OKF — Open Knowledge Format

Use this skill when working on a project that has a `knowledge/` OKF bundle, when initializing one, or when deploying OKF to a new project.

## What OKF Is

OKF is a convention for maintaining project knowledge as markdown files with YAML frontmatter, stored in git alongside code. Git is canonical. Agents read the bundle before starting work; the post-commit hook writes compact Tier 1 captures and `end-session` writes one complementary Tier 2 synthesis at session close.

## Locating the OKF Source Repo

OKF is distributed from the `designs` repo. Resolve `<designs>` in this order:

1. `$DESIGNS_REPO` if set
2. `~/workspace/designs` if it exists
3. Ask the user for the designs repo location

All `<designs>/...` paths below use that root.

## OKF System Knowledge

The OKF system's own knowledge base lives at `<designs>/knowledge/`. It contains concepts documenting the OKF standard, viewer architecture, hook system, installer design, deployment process, seeding strategy, AGENTS.md migration pattern, curation workflow, and schema diagram creation. Any agent deploying or maintaining OKF should read these concepts first.

Key concepts for deployment:
- `<designs>/knowledge/process/deploy-okf.md` — 8-phase deployment workflow overview
- `<designs>/knowledge/process/seed-from-existing-docs.md` — How to seed from existing project docs
- `<designs>/knowledge/process/process-github-epics.md` — Processing closed GitHub epics
- `<designs>/knowledge/process/create-schema-diagrams.md` — Mermaid ER diagram creation
- `<designs>/knowledge/process/migrate-agents-md.md` — AGENTS.md migration pattern
- `<designs>/knowledge/process/curation-pass.md` — Full curation workflow
- `<designs>/knowledge/process/verify-deployment.md` — Deployment verification checklist

The full step-by-step deployment runbook is at `<designs>/templates/okf/DEPLOYMENT-RUNBOOK.md`.

## Deploying OKF to a New Project

When asked to deploy OKF to a project, follow `<designs>/templates/okf/DEPLOYMENT-RUNBOOK.md` in order:

1. **Mechanical Install** — Run `install-okf.sh` to create the knowledge directory structure, viewer, hook, and scripts.
2. **Seed From Existing Docs** — Read AGENTS.md, docs/, docs/design/, docs/agents/ and create 40-80 concepts summarising each significant topic. Use the `resource` field to link back to source docs.
3. **Process GitHub Epics** — List closed epics with `gh issue list --label epic --state closed`. Recent epics get full concepts; older epics get deprecation entries.
4. **Create Schema Diagrams** — If the project has a database, group tables by domain and create mermaid erDiagram concepts per domain plus an architecture index.
5. **Migrate AGENTS.md** — Replace AFFiNE/docs.agents references with OKF knowledge references. Add the OKF Knowledge Bundle section. Add Legacy Documentation Alignment section.
6. **Curation Pass** — Add cross-links, check for duplicates, verify index counts, update log.md.
7. **Generate Viewer** — Run `generate-viz.js` to produce self-contained `viz.html`.
8. **Final Verification** — Verify counts, no AFFiNE references remain, hook is installed, viz.html works.

Read the runbook for detailed instructions for each phase.

## Directory Structure

```
knowledge/
├── index.md          # Root index with concept group counts
├── log.md            # Chronological update history
├── inbox/            # Staging area for commit-time captures
│   ├── index.md
│   └── <timestamp>-<slug>.md
├── architecture/     # How the system is structured
├── components/       # UI components and behavior
├── domain/           # Business logic and domain knowledge
├── decisions/        # Architectural decisions and rationale
├── process/          # How workflows operate
├── deprecation/      # Superseded concepts
└── state/            # Current state of play
```

## Agent Onboarding

When starting work on a project with an OKF bundle:

1. Read `knowledge/index.md` for an overview of all concept groups and counts.
2. Read `knowledge/state/index.md` and any state concept files for current status.
3. Read `knowledge/deprecation/index.md` to understand what has been superseded.
4. Read concept files relevant to the work area (use titles and tags to find them).
5. Do not read everything. Use the index files for progressive disclosure.

## OKF-First Protocol

The knowledge bundle is the first source of truth. Consult it before
investigating the codebase or proposing a course of action:

1. **Before investigating**, query the bundle for the topic. Use
   `knowledge/okf-query.sh <term>` when installed, or grep frontmatter and
   titles directly:

   ```bash
   grep -ril "<term>" knowledge/ --include="*.md" | grep -v index.md
   ```

2. **Before proposing a plan**, read matching concepts in `decisions/` and
   `deprecation/`. If a path was already taken and rejected, do not re-derive
   it: cite the concept, state whether its "When This Might Be Relevant Again"
   conditions apply, and only then decide.
3. **Cite what you reuse.** When a concept answers the question, reference it
   instead of re-investigating the codebase.
4. **Trust but verify freshness.** If a concept's `timestamp` is old and its
   `resource` file has newer commits, verify against code before relying on it,
   and note the staleness in your session synthesis.
5. **Record rejected paths.** When you evaluate and reject an approach during a
   session, write the rejection and its reason into your inbox synthesis so
   curation can turn it into a decision or deprecation lesson. This is how
   repeat investigations are prevented.

## Writing Inbox Items

The inbox has two complementary capture tiers. They must not restate each
other; Git remains the source for changed files.

### Tier 1: Commit Capture

The repository post-commit hook writes one compact `capture_tier: commit` item
for each ordinary commit. Supply its rationale through a commit body that says
why/how and includes an `Impact:` trailer:

```text
type(scope): subject

<why and how>

Impact: <what this affects>
```

The hook extracts the rationale, impact, commit SHA, branch, and issue
references. A subject-only commit is captured with explicit gaps so authors can
correct future commit bodies.

### Tier 2: Session Synthesis

At session close, `end-session` writes exactly one `capture_tier: session` item
after work is committed. It references the session commit SHAs instead of
repeating Tier 1 detail:

```yaml
---
type: Inbox
title: <what changed, in product terms>
description: <one line>
tags: [lowercase, consistent]
timestamp: <ISO-8601>
session_id: <session-uuid>
commit_sha: [<sha>, <sha>]
branch: <branch-name>
issue_refs: [<n>]
epic_refs: [<n>]
capture_tier: session
---

# Decisions Made

# What Was Deprecated

# Lessons Learned

# Current State
```

Filename format: `<ISO-timestamp-with-dashes>-<slugified-title>.md`.

## Curation

Curation transforms inbox items into permanent concept files and audits the
bundle. Run it only through an explicit, repository-scoped operator action via
the `okf-curator` agent (installed to `.factory/droids/` and `.claude/agents/`
by the OKF installer), the pi `/okf-curate` command, or the steps below. Do not
add schedules, cron, Factory automation, or a cross-project rollout before Epic
#26's First Decision Gate approves bounded execution controls.

Steps:

1. Read all unprocessed inbox items.
2. Read existing concept files in relevant directories.
3. Read the codebase and git history for additional context.
4. **Fetch and read GitHub issues referenced by `issue_refs` in inbox item frontmatter.**
   - Use: `gh issue view <number> --json body,title,labels --jq '.body'`
   - Issues contain rich context: pre-approved directives, acceptance criteria, linked epics, and full reasoning.
   - Use this context to enrich concepts beyond what the commit message alone provides.
5. For each inbox item, determine which concept(s) to create or update.
6. Create new concept files with proper frontmatter (include `issue_refs` when applicable).
7. Update existing concepts by merging new information.
8. Move superseded concepts to `deprecation/` with `supersedes` links.
9. Move processed inbox items to `inbox/processed/`.
10. Audit the bundle: merge redundant concepts, resolve contradictions
    (concept vs concept, concept vs code, concept vs AGENTS.md), and fix
    ambiguous or broken `resource` fields and cross-links.
11. Report AGENTS.md alignment proposals (current text -> proposed text) and
    offer to apply them; never patch AGENTS.md without approval.
12. Update all `index.md` files with current listings.
13. Update `log.md` with a summary of changes.

## Concept Frontmatter

```yaml
---
type: Architecture              # REQUIRED
title: SpacetimeDB Tenant Model  # Recommended
description: One-line summary     # Recommended
resource: ./src/db/schema.ts     # Recommended
tags: [backend, spacetime-db]    # Recommended
timestamp: 2026-06-29T10:00:00Z # Recommended
status: active                   # active | deprecated | in-progress | blocked
supersedes: [old-pattern.md]     # For deprecation entries
issue_refs: [1503]               # Ticket references
---
```

## Concept Types

| Type | Directory | Use For |
|------|-----------|---------|
| Architecture | architecture/ | System structure, data models, infrastructure |
| Component | components/ | UI components, interaction patterns |
| Domain | domain/ | Business logic, domain entities, rules |
| Decision | decisions/ | Architectural decisions and rationale |
| Process | process/ | Workflows, sprint flow, deployment gates |
| Deprecation | deprecation/ | Superseded patterns with links to replacements |
| State | state/ | Current state: what works, in progress, blocked |
| Inbox | inbox/ | Session syntheses awaiting curation |

## Rules

- Never delete a concept file. Move superseded ones to `deprecation/` instead.
- Always update `index.md` files when adding or updating concepts.
- Always log curation actions in `log.md`.
- Use lowercase tags. Keep tags consistent across concepts.
- Filenames should be slugified versions of the title.
- One concept per file. Do not mix types.
- The `resource` field should point to the most relevant code file or issue.
