# 25A — Codex-Agentic Index Transcript Cleanup

## Context
- Final hardening task for the Q4 2025 `codex-agentic` release: keep index progress out of the chat transcript while retaining footer/toast visibility.
- Grounded in `04-SYSTEM-PROMPT-INJECTION-BUILD.md`, `07-INDEX-ENGINE-INTEGRATION-DIRECT.md`, `08-TUI-INDEX-STATUS-INTEGRATED.md`, `19-SEARCH-CODE-SLASH-COMMAND.md`, `22-UNIFIED-PROVIDER-REASONING-HANDLING.md`, `23-MEMORY-MANAGER-IMPLEMENTATION.md`, plus the master log in `00-IMPLEMENTATION-CHECKLIST.md`.

## Worktree & Branch Requirements
- Do **not** develop from `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs`.
- Create a dedicated worktree for this segment:
 1. `cd /Users/tonyholovka/workspace/codex-pro/codebase/codex-pro`
 2. `mkdir -p codex-rs-worktrees`
 3. `git fetch origin main`
 4. `git worktree add -B feature/index-transcript-cleanup codex-rs-worktrees/index-cleanup origin/main`
     - Creates (or resets) `feature/index-transcript-cleanup` from `origin/main` (`codex-cli` v0.50.0).
 5. `cd codex-rs-worktrees/index-cleanup`
- Perform **all** edits, commits, builds, and tests within this worktree.

## Objectives
1. Ensure index progress and delta updates no longer render as chat history entries.
2. Preserve footer progress bar, completion toast, and analytics updates.
3. Maintain `/search-code` result rendering behaviour.

## Implementation Outline
- Audit `tui/src/app.rs`, `tui/src/chatwidget.rs`, and bottom pane composers for the code path that converts `IndexEvent` into transcript items; redirect progress events into footer state only.
- Introduce (or reuse) an `AppEvent::IndexStatus` channel to carry progress updates without generating `HistoryEntry`.
- Permit terminal events (completed, error) to surface via footer/toast only; optional short summary toast is acceptable but no transcript messages.
- Confirm analytics refresh logic remains intact (doc 07 acceptance criteria).

## Validation & Handoff
- Inside the worktree:
  - `just fmt`
  - `just fix -p codex-tui`
  - `cargo test -p codex-tui` (accept/review snapshots via `cargo insta` if required)
  - **Mandatory build gate**: `cargo build -p codex-cli --bin codex-agentic`
- Manual check: run `/index` in the TUI (or snapshot preview) and verify no chat bubbles appear.
- After a clean build, pause for product UAT (handover to Tony), note results in `00-IMPLEMENTATION-CHECKLIST.md` once approved.


## Reminder
- Reused the existing toast lane inside `App::refresh_index_status_line` by introducing a `show_index_toast` helper; index start, completion, errors, and filesystem deltas now surface through the footer/toast path without generating transcript cells.
- Preserved analytics refresh by keeping the `IndexStatusSnapshot` reload that runs on completion and continuing to respect the existing refresh tickers.
- Validated with `just fmt`, `just fix -p codex-tui`, `cargo test -p codex-tui`, and `cargo build -p codex-cli --bin codex-agentic`; no snapshot updates required.
- Centralising toast emission avoids scattered `add_info_message`/`add_error_message` calls and makes it harder for regressions to leak into the transcript again.
- The current Clippy profile still flags legacy styling helpers (e.g., `Color::Indexed`); addressing that separately would quiet unrelated warnings during focused work like this.
