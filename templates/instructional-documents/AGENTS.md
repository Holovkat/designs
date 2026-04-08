# AGENTS.md — instructional-documents/

## Package Identity
- Documentation repository containing reference guides, workflows, and technical specifications.
- Tech: Markdown with embedded code examples, diagrams via links.
- Primary focus: Developer onboarding, workflow guidance, and technical reference material.

## Setup & Run
- No build process required; edit Markdown directly
- Preview: Use Markdown editor or GitHub's preview functionality
- Validate links: Check that all internal links resolve correctly
- Format: Consistent Markdown formatting with proper headers

## Patterns & Conventions
- Use consistent header hierarchy (##, ###, ####)
- Include file paths in backticks for easy copying
- Link to external resources rather than duplicating content
- Use code blocks with language specification for examples
- Keep documents focused on single topics
- Cross-reference related documents where helpful

### Document Types
- Workflow guides: Step-by-step processes (e.g., github-workflow.md)
- Technical guides: Implementation instructions (e.g., WorkOS-Convex-Nextjs-Implementation-Guide.md)
- Templates: Reusable patterns (e.g., Frontend-Technical-Functional-Requirements-Document-TFD.md)
- Prompts: AI/LLM guidance (e.g., github-usage-system-prompt.md)

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
- TFD template: `Frontend-Technical-Functional-Requirements-Document-TFD.md`
- Session installer: `install-session-workflows.sh`
- Session commands: `commands/`
- Session backend scripts: `scripts/`
- Session lifecycle skills: `skills/`
- Worktree guidance templates: `worktrees/`
- WorkOS integration: `WorkOS-Convex-Nextjs-Implementation-Guide.md`
- Architecture guide: `architecture.md`
- UX standards: `ux_design_standards.md`
- Tailwind guide: `tailwind.md`
- Stripe integration: `stripe-payment-gateway.md`
- System prompts: `github-usage-system-prompt.md`

## JIT Index Hints
- Find workflow guides: `rg -n "## Overview" instructional-documents/*.md`
- Find code examples: `rg -n "```" instructional-documents/*.md`
- Find file references: `rg -n "\`.*\.\w+\`" instructional-documents/*.md`
- Find external links: `rg -n "http" instructional-documents/*.md`
- Find template sections: `rg -n "## Template" instructional-documents/*.md`

## Common Gotchas
- Always verify internal links resolve to actual files/sections
- Keep code examples up-to-date with current implementation
- Avoid including sensitive information or API keys
- Use relative paths for internal file references
- Ensure consistent terminology across related documents
- Update table of contents when adding new sections
- Test code examples before including them in documentation

## Pre-PR Checks
```bash
# Check for broken links
rg -n "\[.*\](.*\.md)" instructional-documents/ | grep -v "http"

# Verify code formatting
rg -n "```" instructional-documents/ -A 1 | grep -E "^(javascript|typescript|bash|sql|json)$"

# Check for consistent headers
rg -n "^#" instructional-documents/ | sort
```

## Documentation Maintenance Guidelines
- Review and update documentation quarterly
- Remove outdated information and deprecated practices
- Add examples for new features as they're implemented
- Cross-reference related documentation to improve discoverability
- Include screenshots or diagrams for complex workflows
- Maintain consistency in formatting and style across all documents
- Add changelog entries for significant documentation updates
