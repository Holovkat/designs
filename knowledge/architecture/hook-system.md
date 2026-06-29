---
type: Architecture
title: Post-Commit Hook System
description: Lightweight commit metadata capture to knowledge/inbox/ via git post-commit hook
resource: ./templates/okf/post-commit.sh
tags: [okf, git, hooks, post-commit, inbox, capture]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Post-Commit Hook System

The OKF post-commit hook is a bash script that captures lightweight commit metadata into `knowledge/inbox/` after each commit. It is intentionally minimal: it records what changed, not why. The heavy curation work (session synthesis, concept upsert) is done separately by the curation agent.

## Installation

The hook is installed by `install-okf.sh` into `.githooks/post-commit` in the project root. The installer sets the local `core.hooksPath` to `.githooks` (not global, to avoid conflicts with other projects). See [Installer Design](./installer-design.md).

## What It Captures

For each commit, the hook writes a markdown file to `knowledge/inbox/` with:

- **Frontmatter:** `type: Inbox`, `title` (commit subject), `description` (commit SHA + author), `tags: [commit]`, `timestamp` (commit timestamp), `commit_sha`, `branch`, and `issue_refs` (extracted from commit subject via `#[0-9]+` pattern).
- **Body:** Commit metadata (subject, author, branch, timestamp, issues) and a `## Changed Files` section listing all files changed in the commit via `git show --pretty="" --name-only HEAD`.
- **Notes section:** A comment placeholder for the curation agent to expand with session context.

## Filename Format

`<timestamp-with-dashes>-<slug>.md` where the timestamp is derived from the commit timestamp (colons and periods replaced with dashes, truncated to 19 chars) and the slug is the commit subject lowercased with non-alphanumeric characters replaced by hyphens, truncated to 50 characters.

## Guard Conditions

The hook exits early (exit 0) in several cases:

1. **No knowledge directory:** If `knowledge/` does not exist, the hook does nothing. This allows the hook to remain installed even if the OKF bundle is removed.
2. **Knowledge is gitignored:** Uses `git check-ignore -q knowledge/` to detect if the knowledge directory is gitignored. If so, the hook skips.
3. **Duplicate prevention:** If the target inbox file already exists (e.g., after a rebase that replays the same commit), the hook exits without writing a duplicate.

## Edge Cases and `set -e`

The script uses `set -euo pipefail`. Several commands have fallbacks to handle edge cases:

- `git rev-parse --show-toplevel` falls back to `pwd` if not in a git repo.
- `git rev-parse --short HEAD` falls back to `'unknown'`.
- `git rev-parse --abbrev-ref HEAD` falls back to `'unknown'`.
- `git log -1 --format=...` calls fall back to default values.
- Issue ref extraction uses `|| true` to avoid failing when no issue numbers are found.
- Slug generation has a fallback to `"commit"` if the slug is empty.

## Separation of Concerns

The hook is deliberately lightweight because git hooks must be fast. Curation requires full session context, code analysis, and GitHub issue fetching, which is too heavy for a commit hook. The [Post-Commit Capture Model](../decisions/post-commit-capture-model.md) decision documents this rationale.

## Curation Pipeline

Inbox items written by the hook are later processed by the curation agent (see [Curation Pass](../process/curation-pass.md)). The agent reads inbox items, existing concepts, the codebase, and referenced GitHub issues to create or update permanent concept files.
