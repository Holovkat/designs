# 25 — Codex-Agentic Cleanup Plan (Index)

This file now acts as the index for the segmented cleanup plans. Each segment carries the full context, detailed work instructions, and validation gates for an individual agent working in its own Git worktree.

## Segment Overview
- `25A-CODEX-AGENTIC-INDEX-CLEANUP.md` — Remove indexing progress noise from the chat transcript.
- `25B-CODEX-AGENTIC-PROMPT-SEARCH-ALIGNMENT.md` — Align system prompt guidance with semantic index usage.
- `25C-CODEX-AGENTIC-MEMORY-TOGGLE.md` — Expose persisted memory enable/disable controls.
- `25D-CODEX-AGENTIC-MEMORY-SURFACING.md` — Refine auto-apply vs preview behaviour for retrieved memories.

## Shared Expectations
- Follow the contextual guidance reproduced in each segment document.
- Do **not** modify code from this root working tree. Instead, create a dedicated Git worktree (path guidance provided per segment) before making changes.
- After implementing a segment, run `cargo build -p codex-cli --bin codex-agentic` inside the worktree to confirm the crate builds cleanly, then hand over for UAT.
- Update `00-IMPLEMENTATION-CHECKLIST.md` only after the segment has been reviewed and accepted.

## Consolidation & Merge Back Workflow
- Maintain each segment in its own worktree/branch (see segment docs). No direct commits in `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs`.
- After UAT approval for a segment:
  1. Return to the primary repo root `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro`.
  2. `git checkout feature/agentic-enhancements`.
  3. `git merge --no-ff feature/<segment-branch>` (e.g., `feature/index-transcript-cleanup`).
  4. Run `cargo build -p codex-cli --bin codex-agentic` and any targeted tests required by the merged work.
  5. Update `00-IMPLEMENTATION-CHECKLIST.md` with validation notes.
  6. Remove the consumed worktree (`git worktree remove codex-rs-worktrees/<segment-path>`) once merged.
- Repeat for each segment, then perform a final UAT sweep before merging `feature/agentic-enhancements` back to `main`.

Refer to the individual segment files for detailed tasks, dependencies, and verification steps.***
