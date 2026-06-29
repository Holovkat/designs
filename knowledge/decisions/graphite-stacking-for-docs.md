---
type: Decision
title: Graphite Stacking for Documentation Work
description: Decision to use Graphite-style stacking workflow for managing dependent documentation changes
resource: ./templates/instructional-documents/AGENTS.md
tags: [designs, decision, graphite, stacking, documentation, git, workflow]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Graphite Stacking for Documentation Work

## Decision

When updating documentation, use the Graphite-style stacking workflow to manage dependent documentation changes. This is documented in the AGENTS.md files for both the templates area and the instructional-documents area.

## Rationale

1. **Dependent changes** - Documentation updates often depend on each other (e.g., updating a workflow guide depends on updating templates, which depends on updating reference docs). Stacking manages these dependencies naturally.
2. **Small, focused PRs** - Each documentation change is reviewable independently, with clear scope.
3. **Continue while waiting** - Authors can continue working on dependent docs while earlier PRs are under review.
4. **Squash merge keeps history clean** - Each documentation change becomes a single atomic commit.

## Implementation

### Documentation Stack Workflow

```bash
# Base documentation update
git checkout main && git pull origin main
git checkout -b docs/update-workflow-guide

# Dependent documentation updates
git checkout -b docs/update-related-templates
# Target PR to docs/update-workflow-guide

# Documentation that depends on templates
git checkout -b docs/update-example-guides
# Target PR to docs/update-related-templates
```

### Branch Naming for Documentation

- Workflow updates: `docs/update-workflow-name`
- Technical guides: `docs/update-technology-name`
- Templates: `docs/update-template-name`
- Reference docs: `docs/update-reference-area`
- Corrections: `docs/fix-documentation-issue`

### Documentation Commit Messages

```
docs(workflow): update GitHub workflow guide with new stack management
docs(template): enhance TFD template with validation examples
docs(guide): add WorkOS authentication integration steps
fix(docs): correct broken links in architecture guide
refactor(docs): consolidate related authentication documentation
```

### Stack Management

Rebase documentation stack regularly to keep in sync with main. Use `--force-with-lease` for safety. When base documentation merges, update dependent branches by rebasing onto main and changing PR targets.

## Alternatives Considered

- **Single large PR for all doc changes**: Rejected because large PRs are harder to review and slower to merge.
- **Sequential PRs (no stacking)**: Rejected because it blocks work on dependent changes while waiting for reviews.
- **Direct commits to main**: Rejected because documentation changes still benefit from review.

## Consequences

- All documentation PRs must use squash merge
- Stacks should be limited to 3-5 PRs
- Authors need to manage rebasing when parent PRs merge
- Force-with-lease is required instead of force push

## Related Concepts

- [GitHub Workflow Guide](../process/github-workflow.md)
- [Documentation-First Approach](./documentation-first-approach.md)
- [Workflow Guide](../process/workflow-guide.md)
- [Templates Architecture](../architecture/templates-architecture.md)
