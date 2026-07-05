# Knowledge Update Log

<!-- Entries are added in reverse chronological order by the curation agent -->
<!-- Format: ## <ISO timestamp> - <action> -->

## 2026-07-05T13:15:00Z - AGENTS.md Alignment Patches Applied

- Applied 2 AGENTS.md alignment proposals from the curation audit (operator-approved):
  1. Concept count: 48 -> 54 (curation added 6 new concepts)
  2. OKF skill path: `../pi-extensions/skills/okf/SKILL.md` -> `templates/instructional-documents/skills/okf/SKILL.md` (canonical source, distributed via agent-skill-distro)

## 2026-07-05T13:00:00Z - Curation Cycle: Skill Canonicalisation, OKF-First Protocol, Curation Audit, Hook Contradiction Resolution

- **Processed inbox:** 2 items moved to `inbox/processed/`
  - `2026-07-05T11-00-00Z-skill-effectiveness-review-and-canonicalisation.md`
  - `2026-07-05T12-30-00Z-okf-curation-audit-and-okf-first-protocol.md`
- **Created:** `decisions/skill-canonicalisation.md` - Designs repo as canonical source for workflow skills; SKILL.md canonical over commands; three-layer distribution
- **Created:** `decisions/okf-first-protocol.md` - Knowledge bundle is first source of truth; query before investigating, check decisions/deprecation before planning
- **Created:** `decisions/curation-audit-and-nudge.md` - Phase 6 Audit (redundancy, contradictions, ambiguous refs, AGENTS.md alignment); passive nudge at threshold 5
- **Created:** `architecture/okf-query-helper.md` - Portable grep-based concept search tool with frontmatter ranking and --decisions scope
- **Created:** `process/skill-distribution-sync.md` - Three-layer workflow for syncing skills from designs to agent-skill-distro to CLI roots
- **Created:** `deprecation/index.md` - New deprecation directory index
- **Deprecated:** `architecture/hook-system.md` -> `deprecation/post-commit-inbox-capture.md` (with full lesson sections)
  - Issue: Concept described old hook that wrote commit metadata to inbox; hook now only refreshes manifest and nudges
  - Lesson: Hooks should be minimal; agents are better capture sources; instruction docs drift silently from tooling
- **Created:** `architecture/hook-system.md` (new) - Describes current manifest-refresh + curation nudge behavior
- **Updated:** `decisions/post-commit-capture-model.md` - Reflected capture moving from hook to agents; added evolution section and deprecation cross-link
- **Updated:** `domain/inbox-format.md` - Removed hook as inbox source; agents are sole source; updated frontmatter field descriptions
- **Updated:** `domain/concept-types.md` - Removed "written by the post-commit hook" from Inbox type description
- **Updated:** `domain/frontmatter-schema.md` - Updated provenance fields description (no longer "hook-written")
- **Updated:** `domain/link-resolution.md` - Fixed example link text from "captures commit metadata" to "refreshes the viewer manifest and nudges for curation"
- **Updated:** `architecture/okf-standard-spec.md` - Updated design principle #2 (OKF-First Protocol), #3 (two-phase capture wording), onboarding step 5
- **Updated:** `architecture/installer-design.md` - Added query helper and curator droid installation steps; updated description and timestamp
- **Updated:** `state/current-state.md` - Updated hook description, added query helper, curator contract, OKF-first protocol, skill canonicalisation; updated component table
- **Updated:** `state/designs-project-state.md` - Updated skills count (6), added sync script, added new decisions to Key Decisions
- **Updated:** `process/curation-pass.md` - Fixed step 1 (agents, not hook), updated triggering section, added Related Concepts
- **Updated:** `process/deploy-okf.md` - Updated Phase 1 (query helper, curator), Phase 6 (audit), post-deployment section
- **Updated:** All `index.md` files with current listings and accurate counts
- **Audit findings:**
  - Contradiction resolved: hook-system.md described old metadata-writing hook -> deprecated with lessons, new concept created
  - Contradiction resolved: 8 concepts referenced old hook behavior -> all updated in place
  - Ambiguous reference flagged: `architecture/templates-architecture.md` resource `./templates/` is directory-level (acceptable for whole-directory concept)
  - AGENTS.md alignment proposals: 2 proposed (see curation report), not applied

## 2026-06-29T14:30:00Z - Seeded Designs Project Content Concepts

- **Created:** `architecture/design-standard-spec.md` - DESIGN.md standard specification, token schema, section order
- **Created:** `architecture/templates-architecture.md` - Templates directory structure and organisation
- **Created:** `components/component-patterns.md` - UI component patterns (borderless, minimalist, shadcn/ui)
- **Created:** `components/form-patterns.md` - Form patterns (React Hook Form, Zod, wizards)
- **Created:** `components/data-display-patterns.md` - Data display patterns (tables, cards, Kanban, inspector)
- **Created:** `components/interactive-patterns.md` - Interactive patterns (drag-drop, modals, command palette)
- **Created:** `components/layout-patterns.md` - Layout patterns (providers, sidebar, responsive)
- **Created:** `domain/design-tokens.md` - Design token system (OKLCH, Solar Dusk, Tailwind v4)
- **Created:** `domain/ux-design-standards.md` - UX design standards (4 sizes, 2 weights, 8pt grid, 60/30/10)
- **Created:** `process/github-workflow.md` - GitHub Graphite stacking workflow with squash merge
- **Created:** `process/deployment-guide.md` - Dual-environment deployment (Vercel + Dokku on Hetzner)
- **Created:** `process/planning-decomposition.md` - Planning decomposition workflow from README
- **Created:** `process/delivery-lifecycle.md` - Delivery lifecycle from README
- **Created:** `process/agent-generation.md` - Agent generation guides (CLAUDE.md and AGENTS.md)
- **Created:** `process/planning-agent-contracts.md` - Codex planning agent contracts
- **Created:** `process/builder-agent-contracts.md` - Codex builder agent contracts
- **Created:** `process/convex-self-hosted.md` - Convex self-hosted setup guide
- **Created:** `process/stripe-payment-integration.md` - Stripe payment gateway integration guide
- **Created:** `process/workos-auth-integration.md` - WorkOS authentication integration guide
- **Created:** `process/closeout-process.md` - Closeout items and shipping process
- **Created:** `process/kickoff-requirements.md` - Kickoff requirements spec and TFD creation
- **Created:** `process/implementation-checklist.md` - Functional design implementation checklist
- **Created:** `process/install-session-workflows.md` - Session workflow installer
- **Created:** `process/workflow-guide.md` - HTML workflow guide overview
- **Created:** `decisions/documentation-first-approach.md` - Decision to be documentation-first repo
- **Created:** `decisions/graphite-stacking-for-docs.md` - Decision to use Graphite stacking for documentation work
- **Created:** `state/designs-project-state.md` - Current state of designs project content
- **Created:** `components/index.md` - New components directory index
- **Updated:** Root `index.md` with updated concept group counts (48 total)
- **Updated:** `architecture/index.md` with 2 new concepts (7 total)
- **Updated:** `domain/index.md` with 2 new concepts (7 total)
- **Updated:** `decisions/index.md` with 2 new concepts (5 total)
- **Updated:** `process/index.md` with 15 new concepts (22 total)
- **Updated:** `state/index.md` with 1 new concept (2 total)
- Total new concepts created: 27 (21 existing OKF concepts + 27 designs concepts = 48 total)

## 2026-06-29T14:30:00Z - Initial Knowledge Bundle Creation

- **Created:** `architecture/okf-standard-spec.md` - OKF v0.1 standard specification
- **Created:** `architecture/viewer-architecture.md` - Viewer architecture (browse/graph tabs, mermaid, link interception)
- **Created:** `architecture/hook-system.md` - Post-commit hook design and edge cases
- **Created:** `architecture/installer-design.md` - Installer script design and deployment steps
- **Created:** `architecture/viz-generator-design.md` - Viz generator design and data embedding
- **Created:** `domain/concept-types.md` - The 8 concept types and usage guidance
- **Created:** `domain/frontmatter-schema.md` - Required and optional frontmatter fields
- **Created:** `domain/link-resolution.md` - How relative links resolve to concept IDs in the viewer
- **Created:** `domain/index-structure.md` - Root and subdirectory index file formats
- **Created:** `domain/inbox-format.md` - Inbox item format and lifecycle
- **Created:** `process/deploy-okf.md` - Full 8-phase deployment workflow overview
- **Created:** `process/seed-from-existing-docs.md` - Seeding concepts from existing project docs
- **Created:** `process/process-github-epics.md` - Processing closed GitHub epics into knowledge
- **Created:** `process/create-schema-diagrams.md` - Creating mermaid ER diagram concepts
- **Created:** `process/migrate-agents-md.md` - Migrating AGENTS.md to OKF references
- **Created:** `process/curation-pass.md` - Full curation workflow and rules
- **Created:** `process/verify-deployment.md` - Deployment verification checklist
- **Created:** `decisions/legacy-alignment-mode.md` - Decision to keep existing docs in place
- **Created:** `decisions/post-commit-capture-model.md` - Decision for lightweight hook + separate curation
- **Created:** `decisions/per-project-bundles.md` - Decision for per-project knowledge bundles in git
- **Created:** `state/current-state.md` - Current state of the OKF system as of v0.1
- **Created:** Root `index.md` with concept group counts
- **Created:** Subdirectory `index.md` files for all concept directories
- **Created:** `log.md` (this file)
- **Created:** `inbox/index.md` (empty, no unprocessed items)
