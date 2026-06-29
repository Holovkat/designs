---
type: Process
title: Closeout Process
description: Post-enhancement ship flow for publishing branches, verifying from remote, summarizing state, cleanup, and global install
resource: ./templates/instructional-documents/close_out_items_shipping.md
tags: [designs, closeout, shipping, release, verification, cleanup]
timestamp: 2026-06-29T14:30:00Z
status: active
---

# Closeout Process

## Prerequisites

1. Confirm with requestor that pending changes are approved for shipping (no open TODOs, all reviews resolved)
2. If the request explicitly says to perform close-out actions, do them without deflecting back
3. If anything is unclear or unspecified, pause and ask, do not improvise
4. Follow steps in order. Do not move to the next step if the previous could not be performed

## Step 1: Publish the Branch and Tags

- Fast-forward local `main` to contain approved enhancement commits
- Push `main` to remote: `git push origin main`
- Push the release tag: `git push origin [project_name]-vX.Y.Z`

## Step 2: Verify from Remote Source of Truth

- Create a fresh worktree from `origin/main`
- Run the release build in the verification worktree
- After build succeeds (and UAT signs off), remove the verification worktree

## Step 3: Summarize Repository State

- Report list of local branches still present
- Confirm no staged or unstaged files
- Record `origin/main` commit SHA and call out any divergence

## Step 4: Cleanup (After Approval)

- Remove temporary branches and worktrees created for the release

## Step 5: Install the Released Binary Globally

- Run `cargo install --path cli --bin [project_name]-agent` to update the user's default executable

## Step 6: Document Release Metadata

- List the latest five tags in reverse chronological order for stakeholder visibility

## Key Rules

- Do NOT continue if a step fails. Tell the user why and discuss how to plan the move forward.
- Only ask follow-up questions when a detail is missing or ambiguous.
- Steps must be followed sequentially.

## Related Concepts

- [Delivery Lifecycle](./delivery-lifecycle.md)
- [GitHub Workflow Guide](./github-workflow.md)
- [Deployment Guide](./deployment-guide.md)
- [Implementation Checklist](./implementation-checklist.md)
