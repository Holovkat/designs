# AGENTS.md — instructional-documents/

## Package Identity
- Documentation repository containing reference guides, workflows, technical specifications, and reusable design/planning templates.
- Tech: Markdown with embedded code examples, diagrams via links, and local DESIGN.md reference material in `../design-standard-v01/`.
- Primary focus: Developer onboarding, workflow guidance, technical reference material, and design-system authoring guidance.

## Setup & Run
- No build process required; edit Markdown directly.
- Preview: Use a Markdown editor or GitHub's preview functionality.
- Validate links: Check that all internal links resolve correctly.
- Format: Maintain consistent Markdown formatting with proper headers.
- Validate a `DESIGN.md`: `npx @google/design.md lint path/to/DESIGN.md`
- Compare revisions to a `DESIGN.md`: `npx @google/design.md diff old/DESIGN.md new/DESIGN.md`
- Export tokens when needed: `npx @google/design.md export --format tailwind path/to/DESIGN.md > tailwind.theme.json`

## Patterns & Conventions
- Use consistent header hierarchy (`##`, `###`, `####`).
- Include file paths in backticks for easy copying.
- Link to external resources rather than duplicating content.
- Keep documents focused on single topics.
- Cross-reference related documents where helpful.
- Prefer local references to the cloned DESIGN.md standard in `../design-standard-v01/` when documenting design-system authoring.

### Document Types
- Workflow guides: Step-by-step processes (e.g., `github-workflow.md`)
- Technical guides: Implementation instructions (e.g., `WorkOS-Convex-Nextjs-Implementation-Guide.md`)
- Templates: Reusable patterns (e.g., `Frontend-Technical-Functional-Requirements-Document-TFD.md`)
- Prompts: AI/LLM guidance (e.g., `github-usage-system-prompt.md`)
- Design-system specs: `DESIGN.md` files with YAML front matter plus markdown rationale

### DESIGN.md Authoring Guidance
- Treat `../design-standard-v01/docs/spec.md` as the canonical local reference for `DESIGN.md` structure, token schema, and section order.
- Use `../design-standard-v01/examples/atmospheric-glass/DESIGN.md` as a concrete example when drafting a new design system or refining a glassmorphism-inspired one.
- Keep the YAML front matter as the machine-readable source of truth and the markdown body as the human-readable rationale.
- Maintain the canonical section order when sections are present: `Overview`, `Colors`, `Typography`, `Layout`, `Elevation & Depth`, `Shapes`, `Components`, `Do's and Don'ts`.
- Prefer token references such as `{colors.primary}` and `{typography.body-md}` inside `components:` instead of repeating literals where shared values already exist.
- When revising a design system, lint the updated file and use `diff` to catch token or prose regressions.

## Graphite Method for Documentation Work

When updating documentation, use the **stacking workflow** to manage dependent documentation changes:

### Documentation Stack Workflow
```bash
# Base documentation update
git checkout main && git pull origin main
git checkout -b docs/update-workflow-guide

- Dependent documentation updates
git checkout -b docs/update-related-templates
# Target PR to docs/update-workflow-guide

- Documentation that depends on templates
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

### Documentation Stack Management
```bash
# Rebase documentation stack
git checkout main && git pull origin main
git checkout docs/update-workflow-guide && git rebase main && git push --force-with-lease
git checkout docs/update-related-templates && git rebase docs/update-workflow-guide && git push --force-with-lease
git checkout docs/update-example-guides && git rebase docs/update-related-templates && git push --force-with-lease

# When base documentation merges, update dependent branches
git checkout docs/update-related-templates && git rebase main && git push --force-with-lease
# Update PR target to main on GitHub
```

## Touch Points / Key Files
- GitHub workflow: `github-workflow.md`
- Release assessment command: `commands/release-assess.md`
- Release vector script: `scripts/release-vector-assess.sh`
- Planning/builder agent contracts: `codex-global-planning-agents.md`, `codex-global-builder-agents.md`
- TFD template: `Frontend-Technical-Functional-Requirements-Document-TFD.md`
- WorkOS integration: `WorkOS-Convex-Nextjs-Implementation-Guide.md`
- Architecture guide: `architecture.md`
- UX standards: `ux_design_standards.md`
- Tailwind guide: `tailwind.md`
- Stripe integration: `stripe-payment-gateway.md`
- System prompts: `github-usage-system-prompt.md`
- DESIGN.md overview: `../design-standard-v01/README.md`
- DESIGN.md spec: `../design-standard-v01/docs/spec.md`
- DESIGN.md example: `../design-standard-v01/examples/atmospheric-glass/DESIGN.md`

## JIT Index Hints
- Find workflow guides: `rg -n "## Overview" instructional-documents/*.md`
- Find code examples: `rg -n "```" instructional-documents/*.md`
- Find file references: `rg -n "\`.*\.\w+\`" instructional-documents/*.md`
- Find external links: `rg -n "http" instructional-documents/*.md`
- Find template sections: `rg -n "## Template" instructional-documents/*.md`
- Find local DESIGN.md files: `find .. -name 'DESIGN.md' -print`
- Inspect DESIGN.md section order/examples: `rg -n "^## " ../design-standard-v01/docs/spec.md ../design-standard-v01/examples/*/DESIGN.md`
- Inspect token groups in DESIGN.md files: `rg -n "^(colors|typography|rounded|spacing|components):" ../design-standard-v01/examples/*/DESIGN.md`

## Common Gotchas
- Always verify internal links resolve to actual files/sections.
- Keep code examples up to date with current implementation.
- Avoid including sensitive information or API keys.
- Use relative paths for internal file references.
- Ensure consistent terminology across related documents.
- Update table of contents when adding new sections.
- Test code examples before including them in documentation.
- In `DESIGN.md`, out-of-order sections may lint with warnings even if the file is otherwise valid.
- Broken token references such as `{colors.primary}` pointing at missing tokens are lint errors.
- Do not let markdown prose drift away from the YAML token values when updating an existing design system.

## Pre-PR Checks
```bash
# Check for broken links
rg -n "\[.*\](.*\.md)" instructional-documents/ | grep -v "http"

# Verify code formatting
rg -n "```" instructional-documents/ -A 1 | grep -E "^(javascript|typescript|bash|sql|json)$"

# Check for consistent headers
rg -n "^#" instructional-documents/ | sort

# Lint any DESIGN.md touched by the change
npx @google/design.md lint path/to/DESIGN.md
```

## Documentation Maintenance Guidelines
- Review and update documentation quarterly.
- Remove outdated information and deprecated practices.
- Add examples for new features as they're implemented.
- Cross-reference related documentation to improve discoverability.
- Include screenshots or diagrams for complex workflows.
- Maintain consistency in formatting and style across all documents.
- Add changelog entries for significant documentation updates.
- When documenting design-system work, link back to the cloned DESIGN.md reference instead of re-stating the full spec in multiple places.
