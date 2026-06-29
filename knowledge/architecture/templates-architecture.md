---
type: Architecture
title: Templates Directory Architecture
description: Organisation of the templates directory containing instructional documents, functional design, and UI/UX guidelines
resource: ./templates/
tags: [designs, templates, architecture, directory-structure, organisation]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Templates Directory Architecture

The `templates/` directory is the reusable planning and instructional library of the designs repository. It contains three main subdirectories plus a root-level AGENTS.md, a DESIGN.md template, and the TFD (Technical Functional Requirements Document) template.

## Directory Structure

```text
templates/
├── AGENTS.md                              Templates area agent instructions
├── DESIGN.template.md                     Starter template for DESIGN.md files
├── Frontend-Technical-Functional-Requirements-Document-TFD.md
├── agile_pm_prompt.md                     (empty placeholder)
├── architecture.md                        Core architecture sidecar model
├── close_out_items_shipping.md            Closeout checklist
├── convex-self-hosted-quickref.md         Convex quick reference
├── convex-self-hosted-setup.md            Convex setup guide
├── deployment-guide.md                    Deployment guide
├── generate-claude-agents.md              CLAUDE.md generation guide
├── generate_agents.md                     AGENTS.md generation guide
├── github-usage-system-prompt.md          GitHub usage system prompt
├── github-workflow.md                     Git stacking workflow guide
├── index.md                               Templates index
├── kickoff-requirements-spec.md           Kickoff requirements template
├── okf/                                   OKF system templates
├── project_management_prompt.md           (empty placeholder)
├── stripe-payment-gateway.md              Stripe integration guide
├── tailwind.md                            Tailwind CSS guide
├── ui-ux-guidelines/                      UI/UX design pattern references
├── upgrade-template.md                    Version upgrade template
├── ux_design_standards.md                 shadcn/ui design system guidelines
└── work-os-auth.md                        WorkOS authentication guide
```

## Subdirectories

### instructional-documents/

The main instructional area with guides, commands, skills, hooks, scripts, and worktree guidance. Has its own AGENTS.md with Graphite stacking workflow instructions for documentation work. Contains:

- **commands/** - Slash command templates (plan-feature, plan-bugfix, plan-github, plan-review, compliance-review, uat, end-session, join-session, next-phase, release-assess, kingmode)
- **skills/** - Project-local skills (plan-review, release-assess, vibe-fix, worktree-session-lifecycle, worktree-toolkit-init)
- **hooks/** - Git hooks (pre-commit, post-commit, post-edit-lint, code-review-checkpoint, sanity-check, pre-completion-build, batch-lint-check)
- **scripts/** - Shell scripts (release-vector-assess, worktree session management, droid worktree)
- **worktrees/** - Worktree session guidance and metadata
- **install-session-workflows.sh** - Installer for refreshing commands, hooks, scripts, skills, and worktree guidance into another project

### functional-design/

Phased implementation checklist templates. The template baseline is preserved in `00-TEMPLATE-IMPLEMENTATION-CHECKLIST.md`, while `00-IMPLEMENTATION-CHECKLIST.md` tracks the live implementation status for the designs repo itself. Phased files range from `01-ARCHITECTURE-OVERVIEW.md` through `99-DEPLOYMENT-STRATEGY.md`.

### ui-ux-guidelines/

Design token and interface pattern references with a machine-readable `design-tokens.json` for Figma/Style Dictionary. Contains pattern guides for components, forms, data display, interactive elements, and layouts.

### okf/

OKF system templates including the standard specification, deployment runbook, installer script, post-commit hook, viz generator, and viewer.

## Related Concepts

- [DESIGN.md Standard Specification](./design-standard-spec.md)
- [Design Tokens](../domain/design-tokens.md)
- [Component Patterns](../components/component-patterns.md)
- [Planning Decomposition](../process/planning-decomposition.md)
- [Implementation Checklist](../process/implementation-checklist.md)
- [Install Session Workflows](../process/install-session-workflows.md)
- [OKF Standard Specification](./okf-standard-spec.md)
