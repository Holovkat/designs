# Upstream Sync Guide

This document outlines the process for updating the `codex-core` Git submodule to a newer version. Because `macicodex` uses a "Sidecar" architecture, the process is systematic, but it requires careful attention to the integration points between our custom code and the upstream dependency.

## The Upgrade Process

The general workflow for an upgrade is:

1.  **Update the Submodule**: Navigate to the `codex-core` directory and check out the desired tag or commit.
    ```bash
    cd codex-core
    git fetch --all --tags
    git checkout v0.44.0 # Or another target version
    cd ..
    git add codex-core
    ```
2.  **Attempt to Compile**: Run `cargo check --workspace` or `cargo build`. This will immediately reveal all compile-time breakages caused by API changes.
3.  **Fix and Test**: Methodically fix the breakages by focusing on the key areas listed below. Test each area as you go.

## Key Areas to Monitor for Breaking Changes

When upgrading, the following four areas are the most likely sources of conflicts and breakages.

### 1. Upstream CLI Command Definitions

-   **What it is**: The `codex-agentic` binary integrates and re-exposes the upstream CLI commands (like `resume`, `exec`, `mcp`) by defining its own `clap` structures that call into the `codex-core` library.
-   **Potential Breakage**:
    -   Upstream renames, removes, or adds commands.
    -   Flags for existing commands are changed (e.g., `resume --last` becomes `resume --latest`).
-   **Action Plan**:
    1.  Inspect the `clap` definitions in the new `codex-core` version (likely in a `cli.rs` or `main.rs` file).
    2.  Update the `clap` command enums and structs in `codex-agentic/src/main.rs` to mirror the new upstream structure.
    3.  Ensure the logic that calls the underlying library functions matches the new command structure.

### 2. Core Crate API (`codex-core/codex-rs/core`)

-   **What it is**: Your custom crates (`codex-agentic`, `codex-acp`) directly call public functions and use data structures from the `codex-core` library.
-   **Potential Breakage**:
    -   Changes to function signatures, structs, or enums (e.g., `Session`, `Event`).
    -   Modules are moved or reorganized, breaking `use` statements.
-   **Action Plan**:
    1.  Use the `cargo check` output as your guide.
    2.  Methodically fix compilation errors by updating function calls, struct initializations, and `use` paths to match the new v0.44 API.

### 3. Configuration (`config.toml`)

-   **What it is**: `macicodex` relies on the configuration keys defined by `codex-core` and adds its own.
-   **Potential Breakage**:
    -   Upstream renames, removes, or changes the accepted values for keys like `model_provider`, `sandbox_mode`, or `approval_policy`.
    -   New mandatory configuration keys are introduced.
-   **Action Plan**:
    1.  Carefully `diff` the new `codex-core/docs/config.md` against the previous version.
    2.  Update any logic in `codex-agentic` that sets or reads configuration values.
    3.  Test your custom configuration recipes (e.g., `--yolo-with-search`) to ensure they still work.

### 4. Agent Prompts (`prompt.md`)

-   **What it is**: The system prompts in `codex-core/codex-rs/core/` define the agent's core behavior, personality, and tool-use logic.
-   **Potential Breakage**:
    -   Changes in tool-use instructions could affect how the agent interacts with your custom-injected search results.
    -   Changes to the expected output format could break features that parse the agent's responses.
-   **Action Plan**:
    1.  `diff` the new `prompt.md` and `gpt_5_codex_prompt.md` files.
    2.  Perform end-to-end testing on your key features (like `/about-codebase` and `/search`) to check for behavioral regressions.