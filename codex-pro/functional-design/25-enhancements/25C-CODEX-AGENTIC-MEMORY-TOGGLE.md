# 25C — Codex-Agentic Memory Runtime Toggle

## Context
- Deliver a persisted enable/disable control for the MiniCPM-backed memory runtime across CLI and TUI surfaces before the Q4 2025 release.
- References: `04-SYSTEM-PROMPT-INJECTION-BUILD.md`, `22-UNIFIED-PROVIDER-REASONING-HANDLING.md`, `23-MEMORY-MANAGER-IMPLEMENTATION.md`, `19-SEARCH-CODE-SLASH-COMMAND.md`, `00-IMPLEMENTATION-CHECKLIST.md`.

## Worktree & Branch Requirements
- Leave `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs` untouched. **Work for 25C must be done exclusively inside the pre-created worktree.**
- Use the existing worktree sourced from `origin/main`:
 1. `cd /Users/tonyholovka/workspace/codex-pro/codebase/codex-pro`
 2. `cd codex-rs-worktrees/memory-toggle`
 3. `git status -sb` (should show `feature/memory-toggle...origin/main`)
- Confine all edits, staging, commits, formatting, and verification to this worktree. Do not make changes in the main checkout.

## Objectives
1. Persist a boolean `enabled` flag in memory settings (default true) and surface it through `MemorySettingsManager`.
2. Extend CLI (`codex memory`) with `enable`/`disable` (or symmetric) commands that write the flag, maintaining compatibility with existing runtime switches.
3. Update TUI `/memory` overlay to expose a toggle reflecting the persisted state, with clear status/toasts when memory is off.
4. Ensure planner initialization respects the flag, skipping MiniCPM downloads and preview events when disabled.

## Implementation Outline
- Modify `core/src/memory/settings.rs` (and related structures) to read/write the new `enabled` field with migration defaults.
- Update CLI command handlers to control the setting and print confirmation of the new state.
- Adjust TUI overlay (`tui/src/memory_manager.rs`) so toggling updates settings, closes overlays appropriately, and refreshes status banners.
- When disabled, ensure `MemoryRuntime` is not constructed; guard preview event emission.

## Validation & Handoff
- In the worktree:
  - `just fmt`
  - `just fix -p codex-core`
  - `just fix -p codex-cli`
  - `just fix -p codex-tui` (if UI updated)
  - `cargo test -p codex-core memory::retriever::tests`
  - `cargo test -p codex-cli memory_cli_crud_flow`
  - `cargo test -p codex-tui` (accept snapshots if required)
  - **Mandatory build gate**: `cargo build -p codex-cli --bin codex-agentic`
- Manual verification: toggle memory off via CLI, launch TUI to confirm indicator and absence of previews, re-enable via TUI manager.
- Following a clean build, hand off for UAT before updating `00-IMPLEMENTATION-CHECKLIST.md`.


### Reminder
- Collapsed duplicate memories by normalizing summaries and deduping on `(MemorySource, summary)` during ingestion, pruning, and retrieval. Startup now prunes stale entries automatically and the CLI exposes `codex memory prune-duplicates` for on-demand cleanup.
- Memory previews continue to honor the persisted enable/disable toggle, and injected context is emitted as an assistant message to satisfy the Responses API guardrails.
- TUI memory manager reflects the deduped dataset after pruning; repeated “hi” or “what’s this codebase…” rows per role are no longer surfaced once pruning runs.
- Deduping solely on conversation identifiers missed cross-session dupes; aligning on semantic summary + source provides better recall while preserving role-specific nuances.
- Memory context injections must respect downstream channel constraints—using `assistant` avoids 400 errors from providers that forbid synthetic system messages.
- Dedupe logic should run both at runtime startup and interactively (via CLI) to keep long-lived stores healthy; documentation should highlight the manual prune command for operators.
