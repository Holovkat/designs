---
type: State
title: Designs Project Content State
description: Current state of the designs project's own content including templates, guides, UI/UX patterns, and infrastructure docs
resource: ./README.md
tags: [designs, state, content, templates, guides, ui-ux, infrastructure]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Designs Project Content State

## Overview

The designs repository is a documentation-first collection of reusable project-design templates, agent workflow commands, project-local skills, and delivery operating model guidance. This concept documents the state of the project's own content (separate from the OKF system state).

## What Exists

### README and Top-Level
- README.md with project overview, planning decomposition mermaid diagram, delivery lifecycle mermaid diagram, and repository structure
- AGENTS.md with OKF knowledge bundle instructions
- GitHub Pages site at `https://holovkat.github.io/designs/`

### Workflow Guide (docs/workflow-guide/)
- `index.html` - 1039-line HTML operating model covering overview, installation, commands, intent confidence, planning intake, planning decomposition, approval gates, and more
- `install.html` - Installation instructions page
- `assets/workflow.css` and `assets/workflow.js` - Supporting assets
- `docs/superpowers/` - Plans and specs subdirectories (minimal content)

### Templates Area
- **AGENTS.md** - Templates area agent instructions with DESIGN.md authoring guidance and Graphite stacking workflow
- **DESIGN.template.md** - Starter template for spec-compliant DESIGN.md files
- **Frontend-Technical-Functional-Requirements-Document-TFD.md** - TFD template and standards
- **index.md** - Templates index

### Instructional Documents (templates/instructional-documents/)
- **AGENTS.md** - Area-specific agent instructions with DESIGN.md authoring guidance
- **index.md** - Index of all instructional documents
- **github-workflow.md** - Complete Graphite stacking workflow guide with squash merge requirements
- **github-usage-system-prompt.md** - System prompt for Git/GitHub workflow
- **deployment-guide.md** - Dual-environment deployment (Vercel + Dokku on Hetzner)
- **architecture.md** - Core architecture "sidecar" model guide
- **stripe-payment-gateway.md** - Stripe integration with Convex-specific lessons
- **work-os-auth.md** - WorkOS authentication implementation guide
- **tailwind.md** - Tailwind CSS v4 usage rules
- **ux_design_standards.md** - shadcn/ui with Tailwind v4 design system guidelines
- **upgrade-template.md** - Upstream release alignment template
- **close_out_items_shipping.md** - Post-enhancement ship flow checklist
- **kickoff-requirements-spec.md** - Requirements gathering and TFD creation process
- **generate-claude-agents.md** - CLAUDE.md hierarchy generation guide
- **generate_agents.md** - AGENTS.md hierarchy generation guide
- **codex-global-planning-agents.md** - Planning agent pack contract
- **codex-global-builder-agents.md** - Builder agent pack contract
- **convex-self-hosted-quickref.md** - Convex self-hosted quick reference
- **convex-self-hosted-setup.md** - Full Convex self-hosted infrastructure documentation
- **commands/** - 18 slash command templates and scripts
- **skills/** - 5 project-local skills (plan-review, release-assess, vibe-fix, worktree-session-lifecycle, worktree-toolkit-init)
- **hooks/** - 8 git hooks with settings.json files
- **scripts/** - 9 shell scripts for release vectors and worktree session management
- **worktrees/** - Worktree session guidance with AGENTS.md and README.md
- **install-session-workflows.sh** - Session workflows installer script

### Functional Design Templates (templates/functional-design/)
- **00-IMPLEMENTATION-CHECKLIST.md** - Live implementation status for designs repo (Codex planning + builder agent packs)
- **00-TEMPLATE-IMPLEMENTATION-CHECKLIST.md** - Archived template baseline
- **01-ARCHITECTURE-OVERVIEW.md** through **10-CI-CD-PIPELINE.md** - Phased setup templates
- **98-TESTING-AND-VERIFICATION.md** and **99-DEPLOYMENT-STRATEGY.md** - Post-release templates

### UI/UX Guidelines (templates/ui-ux-guidelines/)
- **README.md** - Overview with minimalist/borderless design philosophy (Notional-inspired)
- **design-tokens.md** - OKLCH color system, "Solar Dusk" palette, Tailwind v4 integration
- **design-tokens.json** - Machine-readable tokens for Figma/Style Dictionary
- **component-patterns.md** - 412 lines of component conventions
- **form-patterns.md** - 584 lines of form field, validation, and wizard patterns
- **data-display-patterns.md** - 978 lines of table, card, list, and Kanban patterns
- **interactive-patterns.md** - 1047 lines of drag-drop, modal, and interaction patterns
- **layout-patterns.md** - 657 lines of page layout, sidebar, and responsive patterns

### Design Standard (design-standard-v01/)
- Cloned DESIGN.md standard repository (version alpha)
- **README.md** - Format overview, CLI reference, linting rules
- **docs/spec.md** - Full format specification (356 lines)
- **examples/** - Example DESIGN.md files (e.g., atmospheric-glass)
- **packages/** - CLI packages (@google/design.md)

### Other Directories
- **coder-pro/** - Features and instructions subdirectories
- **codex-pro/** - Functional design and instructional documents subdirectories
- **fms/** - FMS project snapshots with requirements, functional design, and instructional documents

## What Is In Progress

- Codex Global Planning Agent Pack (Sprint 1) - 11 issues tracked in implementation checklist
- Codex Builder Agent Pack (Sprint 2) - 9 issues tracked in implementation checklist
- OKF system adoption and refinement

## What Is Blocked

- Nothing currently blocked for the designs project content.

## Component Status Summary

| Component | Status | Location |
|-----------|--------|----------|
| README | Complete | `README.md` |
| Workflow Guide (HTML) | Complete | `docs/workflow-guide/index.html` |
| GitHub Workflow Guide | Complete | `templates/instructional-documents/github-workflow.md` |
| Deployment Guide | Complete | `templates/instructional-documents/deployment-guide.md` |
| Architecture Guide | Complete | `templates/instructional-documents/architecture.md` |
| Stripe Integration Guide | Complete | `templates/instructional-documents/stripe-payment-gateway.md` |
| WorkOS Auth Guide | Complete | `templates/instructional-documents/work-os-auth.md` |
| Tailwind Guide | Complete | `templates/instructional-documents/tailwind.md` |
| UX Design Standards | Complete | `templates/instructional-documents/ux_design_standards.md` |
| Convex Self-Hosted Docs | Complete | `templates/instructional-documents/convex-self-hosted-*.md` |
| Planning Agent Contracts | Complete | `templates/instructional-documents/codex-global-planning-agents.md` |
| Builder Agent Contracts | Complete | `templates/instructional-documents/codex-global-builder-agents.md` |
| Agent Generation Guides | Complete | `templates/instructional-documents/generate-*.md` |
| UI/UX Guidelines | Complete | `templates/ui-ux-guidelines/` (7 files) |
| Design Standard | Complete (alpha) | `design-standard-v01/` |
| Session Workflows Installer | Complete | `templates/instructional-documents/install-session-workflows.sh` |
| Functional Design Templates | Complete | `templates/functional-design/` (14 files) |
| Slash Commands | Complete | `templates/instructional-documents/commands/` (18 files) |
| Project Skills | Complete | `templates/instructional-documents/skills/` (5 skills) |
| Git Hooks | Complete | `templates/instructional-documents/hooks/` (8 hooks) |
| Session Scripts | Complete | `templates/instructional-documents/scripts/` (9 scripts) |
| Codex Planning Agent Pack | In Progress | `~/.codex/agents/` (Sprint 1) |
| Codex Builder Agent Pack | In Progress | `~/.codex/agents/` (Sprint 2) |

## Key Decisions

- [Documentation-First Approach](../decisions/documentation-first-approach.md): README is GitHub index, HTML guide is canonical operating model
- [Graphite Stacking for Docs](../decisions/graphite-stacking-for-docs.md): Use stacking workflow for dependent documentation changes

## Related Concepts

- [OKF System Current State](./current-state.md)
- [Templates Architecture](../architecture/templates-architecture.md)
- [DESIGN.md Standard Specification](../architecture/design-standard-spec.md)
- [Planning Decomposition](../process/planning-decomposition.md)
- [Delivery Lifecycle](../process/delivery-lifecycle.md)
- [Documentation-First Approach](../decisions/documentation-first-approach.md)
