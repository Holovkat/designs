# Refactoring Plan: Decoupling codex-pro from Upstream

This document outlines the strategy for refactoring the `macicodex` codebase to isolate custom features from the upstream `openai/codex` core. The primary goal is to create a stable, maintainable architecture that prevents the loss of custom functionality when syncing with the upstream repository.

## 1. The "Sidecar" Architecture

The core of this plan is to physically and logically separate the original `codex` code from your enhancements using a Git submodule. This treats the upstream code as a versioned dependency, not as a codebase to be directly merged.

### Proposed Directory Structure

```
/macicodex/
├── .git/
├── codex-core/              <-- Git submodule pointing to a specific openai/codex commit
│   ├── .git
│   ├── codex-rs/
│   └── ... (all other original files)
│
├── macicodex/               <-- All your custom code, isolated here
│   ├── codex-acp/
│   ├── codex-agentic/
│   └── codex-tui/           <-- Your enhanced TUI
│
├── .gitignore
└── Cargo.toml               <-- The main workspace definition for the entire project
```

## 2. Phased Implementation Plan

This refactoring will be done in phases to allow for testing at each critical step.

---

### Phase 1: Repository Restructuring (The Big Move)

**Goal:** Physically separate the codebases by creating the `codex-core` submodule and the `macicodex` directory.

**Steps:**

1.  **Add the upstream as a submodule:**
    ```sh
    git submodule add https://github.com/openai/codex.git codex-core
    ```
2.  **Create the `macicodex` directory:**
    ```sh
    mkdir macicodex
    ```
3.  **Move your custom crates:**
    ```sh
    git mv codex-acp macicodex/
    git mv codex-agentic macicodex/
    git mv codex-tui macicodex/
    ```
4.  **Update the root `Cargo.toml`:**
    *   Modify the `[workspace]` members to point to the new paths (e.g., `"macicodex/codex-agentic"`, `"codex-core/codex-rs/core"`).
5.  **Update `Cargo.toml` path dependencies:**
    *   Go through the `Cargo.toml` files in your `macicodex` crates and update all `path = "../"` dependencies to point to the correct location within `codex-core`. For example, a dependency on `codex-core` in `macicodex/codex-acp/Cargo.toml` would change from `path = "../codex-rs/core"` to `path = "../../codex-core/codex-rs/core"`.

**Testing for Phase 1:**
*   After this phase, the project should compile successfully (`cargo build`).
*   The `codex-agentic` binary should still launch, and basic commands (like `status` or `query`) should work.
*   The TUI may have some broken functionality, but it should start.

---

### Phase 2: Re-implementing the Indexing UI

**Goal:** Re-implement the indexing progress UI as a first-class component within the TUI, driven by events from the indexer.

**Steps:**

1.  **Create the UI Widget:**
    *   Create a new file: `macicodex/codex-tui/src/indexing_overlay.rs`.
    *   Implement a new `IndexingOverlay` struct that contains the state for the progress bar (processed files, total files, etc.) and a `render` method to draw it as a modal overlay.

2.  **Define Communication Events:**
    *   In `macicodex/codex-tui/src/app_event.rs`, add new enum variants to `AppEvent`:
        *   `IndexingStarted { total_files: usize }`
        *   `IndexingProgress { processed: usize }`
        *   `IndexingCompleted`
        *   `IndexingError { message: String }`

3.  **Integrate the Widget into the App:**
    *   In `macicodex/codex-tui/src/app.rs`, add `indexing_overlay: Option<IndexingOverlay>` to the `App` struct.
    *   In the main `draw` loop, if `indexing_overlay` is `Some`, render it.
    *   In the `handle_event` function, add a `match` arm to handle the new `Indexing...` events, which will create, update, and destroy the `IndexingOverlay`.

4.  **Modify the Indexer and Slash Command:**
    *   In `macicodex/codex-agentic/src/indexing/mod.rs`, create a new `TuiProgressSink` that implements `IndexProgressSink`. Instead of printing to the console, it will send the `AppEvent`s over a channel.
    *   Modify the `/index build` slash command handler in `codex-tui` to spawn the `codex-agentic index build --progress=json` process, read the JSON from its `stdout`, and send the corresponding `AppEvent`s to the TUI.

**Testing for Phase 2:**
*   Run the TUI.
*   Execute the `/index build` command.
*   **Expected Result:** The ASCII modal should appear, and the progress bar should update as the indexing process runs.

---

### Phase 3: Verification and Cleanup

**Goal:** Ensure all functionality is working as expected and clean up any remaining issues.

**Steps:**

1.  **Full functionality testing:**
    *   Test all features of the application, including ACP, indexing, and the TUI.
2.  **Review and refactor:**
    *   Review the changes and refactor any code that could be improved.
3.  **Update documentation:**
    *   Update any internal documentation to reflect the new architecture.

By following this phased approach, you can incrementally and safely refactor your project while being able to test your progress at each step.
