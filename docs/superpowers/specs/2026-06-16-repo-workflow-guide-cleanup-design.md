# Repo Workflow Guide Cleanup Design

## Purpose

Clean up the `designs` repository so it clearly presents the reusable agent
workflow pack as a generic project delivery operating model.

The GitHub README should be an index and orientation page. The detailed
workflow meta, stage gates, command behavior, CI/CD authority, QA approval, and
production approval guidance should live in a persistent HTML guide under
`docs/` so it can be served by GitHub Pages.

## Scope

In scope:

- Rewrite `README.md` as a GitHub-facing index.
- Add two compact Mermaid diagrams to the README:
  - planning request to epic, phase/sprint, task, and approval gate
  - delivery lifecycle through build, CI/CD, QA/UAT, production, and closeout
- Add a persistent HTML guide under `docs/workflow-guide/`.
- Use the same visual structure as the existing tutorial-style reference:
  sticky topbar, scenario drawer, dark/light theme, Mermaid rendering, two-column
  content, matrix tables, key-value rows, and expandable command/reference
  sections.
- Keep all workflow guidance generic. Project-specific environments, URLs,
  services, tenants, and product names must not appear in the main guide.
- Reference GitHub, GitHub Actions, Vercel, and similar tools only as examples
  of project-defined deployment authorities.
- Link README entries to both repository source paths and the future rendered
  GitHub Pages guide.

Out of scope:

- Enabling GitHub Pages through repository settings.
- Installing commands into another project.
- Changing the existing command and skill pack behavior.
- Deploying, promoting, or cleaning up any hosted environment.
- Refactoring the imported `design-standard-v01/` work unless explicitly folded
  into a separate cleanup slice.

## Information Architecture

`README.md` becomes the index:

- repository purpose
- primary paths
- rendered workflow guide link
- command pack and project skill links
- planning flow Mermaid
- delivery lifecycle Mermaid
- validation and maintenance notes

`docs/workflow-guide/` becomes the canonical detailed guide:

- `index.html`
- `assets/workflow.css`
- `assets/workflow.js`
- optional scenario fragments/pages if the first version benefits from them

Recommended HTML navigation:

1. Overview
2. Planning Intake
3. Epics, Phases / Sprints, and Tasks
4. Approval Gates
5. Build Session
6. Builder Review, Test, and Compliance Gates
7. CI/CD Authority
8. QA Readiness and UAT Approval
9. Production Promotion and Final Approval
10. Closeout and Lessons Learned
11. Command Reference
12. Project-Specific Overlays

## Generic Operating Model

Planning starts through a planning command:

- `/plan-feature` for new feature discovery and issue hierarchy creation.
- `/plan-bugfix` for bug investigation, expected behavior, fix tasks, and
  regression coverage.
- `/plan-github` for importing existing GitHub issues or PRs into the same
  planning hierarchy.

The planning pack decomposes work into:

- an epic or parent issue
- phase / sprint issue groupings
- task issues with acceptance criteria and evidence requirements
- a local checklist that mirrors issue numbers for progress and signoff

Implementation starts only after planning approval. The build session uses a
frozen task packet, isolated worktree/runtime when required, and explicit
ownership boundaries. Writer work and evaluator gates are separated:

- `dev` owns code, tests, task-local fixtures, and small validation artifacts.
- `reviewer`, `tester`, and `compliance` are read-only gates.
- `builder_orchestrator` governs task packets, correction loops, and handoff
  state without absorbing UAT or production approval.

## CI/CD and Environment Rules

Deployment authority is project-defined. It may be GitHub Actions, Vercel,
Cloudflare, Railway, a Docker host, a manual approval pipeline, or another
project-specific mechanism.

Agents must discover the authority before acting:

- read project instructions
- inspect workflow files and hosting docs
- identify canonical environment URLs
- confirm branch, deployment, and domain mapping
- verify approval state and evidence requirements

Agents must not manually deploy, redeploy, promote, remove, or clean up hosted
resources unless the user explicitly asks for that exact action.

QA and production approval evidence must be tied to the canonical environment
and the governed deployment path, not an arbitrary preview or stale build.

## Stage Gates

Required generic gates:

- planning approval before implementation
- task packet freeze before builder lanes start
- review, test, and compliance before ready-for-integration
- CI/CD status before hosted evidence is trusted
- QA readiness manifest before UAT request
- explicit QA/UAT approval before production preparation
- explicit production approval before promotion
- production smoke and final signoff before release completion

Hard stops:

- unclear deployment authority
- mixed environment/auth/data boundaries
- missing approval for hosted mutations
- evidence collected from non-canonical URLs
- stale deployment aliases or unknown deployed commit
- database/data-affecting work without required backup or migration evidence
- substantial hidden prerequisites discovered during implementation

## README Mermaid Diagrams

The README should include plain Mermaid diagrams for GitHub rendering. Do not
depend on clickable Mermaid nodes for navigation. Put reliable Markdown links
near the diagrams.

Diagram 1: planning decomposition.

Diagram 2: delivery lifecycle and gates.

## Validation

For this documentation repo:

- `git diff --check`
- internal link review for changed Markdown and HTML paths
- manual browser/open-file check for `docs/workflow-guide/index.html`
- Mermaid syntax sanity check in README and HTML guide

If the HTML guide uses JavaScript or CSS copied from another local project,
adapt it to generic paths and names before committing.

## Open Decisions

- Whether to make the first HTML version single-page or scenario-fragment based.
  Recommended: start with the tutorial-style scenario drawer and one index page.
  Add fragments only if content length makes navigation cumbersome.
- Whether the existing `design-standard-v01/` import belongs in the same commit.
  Recommended: keep it as a separate slice from this workflow-guide cleanup.
