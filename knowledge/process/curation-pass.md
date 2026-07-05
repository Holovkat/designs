---
type: Process
title: OKF Curation Pass
description: Full curation workflow for processing inbox items, auditing knowledge quality, and maintaining AGENTS.md alignment
resource: ./templates/okf/agents/okf-curator.md
tags: [okf, curation, inbox, maintenance, cross-links, audit]
timestamp: 2026-07-05T12:00:00Z
status: active
---

# OKF Curation Pass

Curation transforms inbox items into permanent concept files and maintains the overall quality of the knowledge base. It can be triggered by the `/okf-curate` command, by dispatching the okf-curator agent (canonical contract at `templates/okf/agents/okf-curator.md`, installed to `.factory/droids/` and `.claude/agents/` by the OKF installer), or as Phase 6 of the deployment workflow. The post-commit hook nudges when `knowledge/inbox/` holds 5 or more unprocessed items.

## Curation Steps

### 1. Read All Unprocessed Inbox Items

Read all `.md` files in `knowledge/inbox/` (not in `inbox/processed/`). These are session syntheses written by the post-commit hook or by agents. See [Inbox Format](../domain/inbox-format.md).

### 2. Read Existing Concept Files

Read concept files in each directory (`architecture/`, `components/`, `domain/`, `decisions/`, `process/`, `deprecation/`, `state/`) to understand the current knowledge state and avoid duplicates.

### 3. Read Codebase and Git History

Read relevant source code and git history for additional context. This helps the curation agent understand the actual state of the codebase, not just what the inbox items describe.

### 4. Fetch GitHub Issues

Fetch and read GitHub issues referenced by `issue_refs` or `epic_refs` in inbox item frontmatter:

```bash
gh issue view <number> --json body,title,labels,closedAt --jq '.body'
```

These issues contain rich context: pre-approved directives, acceptance criteria, linked epics, and full reasoning. They are not just short bug fix notes. If an issue has linked epics or sub-issues, fetch those too. Use this context to enrich concepts beyond what the commit message or session synthesis alone provides.

### 5. Create or Update Concepts

For each inbox item, determine which concept(s) to create or update:

| Inbox content | Target directory |
|---------------|-----------------|
| Architectural changes | `architecture/` |
| UI component work | `components/` |
| Business logic changes | `domain/` |
| Decisions with rationale | `decisions/` |
| Workflow/process changes | `process/` |
| Superseded patterns | `deprecation/` |
| Current status updates | `state/` |

- **New concepts:** Create with proper frontmatter (type, title, description, tags, resource, timestamp, issue_refs).
- **Updated concepts:** Merge new information with existing, preserving prior context.
- **Superseded concepts:** Move the old file to `deprecation/` and add a `supersedes` field.

### 6. Add Cross-Links

Where one concept references another, ensure the body text links to the related concept using relative markdown links (e.g., `[Related](../architecture/viewer-architecture.md)`). See [Link Resolution](../domain/link-resolution.md).

### 7. Check for Duplicates and Missing Concepts

- Merge concepts that cover the same topic.
- If a topic is referenced but has no concept, create one.

### 8. Move Superseded Concepts

Move any superseded concepts to `deprecation/` with `supersedes` links pointing to the replacement.

### 9. Process Inbox Items

Move processed inbox items to `knowledge/inbox/processed/`.

### 9b. Audit the Bundle

Run on every pass, even with an empty inbox:

- **Redundancy control:** merge concepts that overlap in scope (not just literal duplicates); the merged-away file goes to `deprecation/` with a `supersedes` link.
- **Contradiction detection:** check concept vs concept, concept vs code reality, and concept vs AGENTS.md. Resolve in favor of verified current reality; formerly-true claims become deprecation lessons.
- **Ambiguous reference resolution:** every `resource` field and cross-link must resolve; sharpen vague references so agents can follow them without guessing.
- **AGENTS.md alignment:** report mismatches between AGENTS.md and the knowledge bundle or tooling as precise proposed edits. Apply only on operator approval, then log the change.

### 10. Update Indexes and Log

- Update all `index.md` files with current listings and accurate counts. See [Index Structure](../domain/index-structure.md).
- Update `knowledge/log.md` with a summary of all changes in reverse chronological order.

### 11. Update State Concept

Ensure the State concept reflects the current project status after all curation.

## Curation Rules

- Never delete a concept file. Move superseded ones to `deprecation/` instead.
- One concept per file. Do not mix types.
- Filenames should be slugified versions of the title.
- Use lowercase, consistent tags across concepts.
- The `resource` field should point to the most relevant code file, doc, or GitHub issue.
- Always include `issue_refs` in frontmatter when the concept was derived from or relates to GitHub issues.
- Synthesize across multiple inbox items when they relate to the same concept.
- Preserve the reasoning and rationale from inbox items AND GitHub issues, not just the facts.
- Cross-link related concepts using markdown relative paths.

## Curation Output

The curator reports:

```
Curation cycle: <ISO timestamp>

GitHub issues fetched:
- #<number>: <title>

Processed:
- <inbox filename> -> <action taken>

Created:
- <concept filepath>

Updated:
- <concept filepath>

Deprecated:
- <old filepath> -> <new filepath>

Log entry added to knowledge/log.md
```

## Triggering Curation

- **Pi extension:** `/okf-curate` command generates a curation prompt with inbox item list and issue refs.
- **Curator droid:** Dispatch the `okf-curator` droid for a full curation pass.
- **Deployment Phase 6:** Run as part of the [deployment workflow](./deploy-okf.md).
