# 25D — Codex-Agentic Memory Surfacing Refinements

## Context
- Smooth the memory preview experience so high-confidence records auto-apply, while low-confidence or new-session cases prompt users once.
- References: `04-SYSTEM-PROMPT-INJECTION-BUILD.md`, `19-SEARCH-CODE-SLASH-COMMAND.md`, `22-UNIFIED-PROVIDER-REASONING-HANDLING.md`, `23-MEMORY-MANAGER-IMPLEMENTATION.md`, `00-IMPLEMENTATION-CHECKLIST.md`.

## Worktree & Branch Requirements
- Avoid direct edits in `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs`. **Everything for 25D lives in the pre-created worktree.**
- Use the existing worktree that already tracks `origin/main`:
 1. `cd /Users/tonyholovka/workspace/codex-pro/codebase/codex-pro`
 2. `cd codex-rs-worktrees/memory-surfacing`
 3. `git status -sb` (should show `feature/memory-surfacing...origin/main`)
- Keep all modifications, staging, commits, formatting, and tests inside this worktree—do not touch the main checkout.

## Objectives
1. Introduce threshold-based decisions (`AutoApply`, `PromptUser`, `Skip`) for retrieved memories based on confidence and session context.
2. Track session-level metadata to avoid re-prompting on repeated turns with already accepted memories.
3. Emit preview overlays only when `PromptUser` triggers; otherwise inject memories silently.
4. Update metrics to capture auto-apply vs prompt counts for telemetry.

## Implementation Outline
- Extend `core/src/memory/retriever.rs` to compute the new decision enum; allow thresholds to come from settings (default ranges documented in code/comments).
- Update planner (`core/src/codex.rs`, `core/src/state/turn.rs`) to store prior accepted memory IDs per session, using them to influence decisions.
- Modify event pipeline so `MemoryPreview` is emitted only on `PromptUser`.
- Ensure CLI/TUI surfaces (including `/memory` overlay) display status updates reflecting auto-applied memories if needed.

## Validation & Handoff
- Within the worktree:
  - `just fmt`
  - `just fix -p codex-core`
  - `just fix -p codex-agentic-core`
  - `cargo test -p codex-core memory::retriever::tests`
  - `cargo test -p codex-agentic-core`
  - `cargo test -p codex-tui` if preview overlay snapshots change
  - **Mandatory build gate**: `cargo build -p codex-cli --bin codex-agentic`
- Manual validation: simulate multi-turn conversation; verify only the first relevant turn prompts and subsequent turns auto-apply high-confidence hits.
- After a successful build, pause for UAT sign-off before updating `00-IMPLEMENTATION-CHECKLIST.md`.


## Reminder
- Added confidence thresholds (`prompt_confidence`, `auto_apply_confidence`) to memory settings and wired them into a new surfacing decision engine (`AutoApply`, `PromptUser`, `Skip`).
- Session state now tracks accepted memory IDs and whether the current session has already shown a preview so we can avoid repeat prompts.
- Memory telemetry records auto/prompt/skip counts and the CLI exports them via `codex memory stats`.
- The TUI memory manager header renders the auto/prompt/skip totals alongside the confidence line so the counters are visible even in compact layouts.
- Updated unit and snapshot tests cover the three surfacing branches and the revised UI.
- Rendering telemetry inside existing layout rows avoids forcing users to memorize rarely-available resize shortcuts (especially when OS-level bindings conflict).
- Serializing tests that load fastembed prevents nondeterministic failures when the cache lock is shared across suites; this pattern should be reused for other fastembed-dependent tests.
- Memory surfacing logic benefits from explicit session-scoped state (prompted flag, accepted IDs); similar context flags may simplify future conversation features, so keeping them in `SessionState` is preferred over per-turn hacks.
