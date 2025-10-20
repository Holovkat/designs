# Refactor Checklist

## Phase 1: Repository Restructuring

- [x] Add the upstream as a submodule: `git submodule add https://github.com/openai/codex.git codex-core`
- [x] Create the `macicodex` directory: `mkdir macicodex`
- [x] Move your custom crates:
    - [x] `git mv codex-acp macicodex/`
    - [x] `git mv codex-agentic macicodex/`
    - [x] `git mv codex-tui macicodex/`
- [x] Update the root `Cargo.toml`:
    - [x] Modify the `[workspace]` members to point to the new paths.
- [x] Update `Cargo.toml` path dependencies:
    - [x] Update paths in `macicodex/codex-acp/Cargo.toml`.
    - [x] Update paths in `macicodex/codex-agentic/Cargo.toml`.
    - [x] Update paths in `macicodex/codex-tui/Cargo.toml`.
- [ ] **Testing for Phase 1:**
    - [x] Project compiles successfully (`cargo build`).
    - [x] `codex-agentic` binary launches and basic commands work.
    - [x] TUI starts.

## Phase 2: Re-implementing the Indexing UI

- [x] **Create the UI Widget:**
    - [x] Create `macicodex/codex-tui/src/indexing_overlay.rs`.
    - [x] Implement `IndexingOverlay` struct and `render` method.
- [x] **Define Communication Events:**
    - [x] Add `IndexingStarted`, `IndexingProgress`, `IndexingCompleted`, `IndexingError` to `AppEvent` enum in `macicodex/codex-tui/src/app_event.rs`.
- [x] **Integrate the Widget into the App:**
    - [x] Add `indexing_overlay: Option<IndexingOverlay>` to `App` struct in `macicodex/codex-tui/src/app.rs`.
    - [x] Render `indexing_overlay` in the `draw` loop.
    - [x] Handle indexing events in `handle_event` function.
- [ ] **Modify the Indexer and Slash Command:**
    - [x] Create `TuiProgressSink` in `macicodex/codex-agentic/src/indexing/mod.rs`.
    - [x] Modify `/index build` slash command to use `TuiProgressSink`.
- [ ] **Testing for Phase 2:**
    - [x] Run the TUI.
    - [x] Execute `/index build` command.
    - [x] Verify the indexing modal appears and updates.

## Phase 3: Verification and Cleanup

- [ ] **Full functionality testing:**
    - [ ] Test all features of the application.
- [ ] **Review and refactor:**
    - [ ] Review and refactor the changes.
- [ ] **Update documentation:**
    - [ ] Update internal documentation.
