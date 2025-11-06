# Upstream Sync Guide

This document outlines the process for updating the `codex-core` Git submodule to a newer version. Because `codex-pro` uses a sidecar architecture, the process is systematic, but it requires careful attention to the integration points between our custom code and the upstream dependency as well as the design docs that track each phase.

## The Upgrade Process

The general workflow for an upgrade is:

1.  **Update the Submodule**: Navigate to the `codex-core` directory and check out the desired upstream tag (e.g. `rust-v0.55.0`).
    ```bash
    cd codex-core
    git fetch --all --tags
    git checkout rust-v0.55.0 # Or the target release tag
    cd ..
    git add codex-core
    ```
2.  **Stage the alignment plan**: Update the execution log in `designs/codex-pro/functional-design/26-codex-55/26-codex-55-upstream-alignment-plan.md` (or the active phase file) before touching source so every phase/commit block is captured chronologically.
3.  **Attempt to Compile**: Run `cargo check --workspace` or `cargo build` to surface compile-time breakages immediately.
4.  **Fix and Test**: Methodically address breakages by focusing on the key areas listed below. Record each fix/test outcome in the alignment plan as you progress.
5.  **Generate the chronological checklist**: Group commits by upstream release bump (e.g., `rust-v0.54.0 → rust-v0.55.0`) and list every commit within that block chronologically. If a release window is large, sub-group in batches of ten; never mix commits from different bumps. Capture the checklist inside the alignment plan so future agents can tick items during their roll-forward.
6.  **Review and reconcile behaviour**: Carefully review upstream changes and reconcile them with downstream customisations (CLI workflows, BYOK plumbing, semantic index). Note any deltas requiring follow-up in `codex-0.55.0-upgrade-plan.md`.
7.  **Update dependencies & generated assets**: When upstream bumps dependency versions or generated files, update `Cargo.toml`, run `cargo update`, and regenerate OpenAPI/TypeScript/MCP bindings in the same commit.
8.  **Execute validations**: Follow the validation cadence captured in the upgrade plan (scoped `just fix -p …`, targeted `cargo test`, `cargo insta pending-snapshots`, etc.). Mark skipped steps with rationale.
9.  **Refresh documentation**: After each functional change, update the relevant design docs (`09-MODEL-PROVIDERS-AND-SELECTION.md`, `16-CUSTOM-PROVIDERS-BYOK.md`, alignment plan) so future phases reflect the current behaviour. Remove or annotate any instructions that no longer apply.
10. **Commit & push**: Commit in logical batches (typically one per upstream release group), push to the alignment branch, and open a PR once validations are complete.
11. **Merge & release**: Merge after review, update release notes, and follow the downstream release checklist.

**Note**: Keep `workspace.package.version` (and any packaged binaries) aligned with the upstream release number.
**Note**: Always roll forward upstream commits onto the downstream branch. **Do not attempt to “sync” upstream with downstream changes.**
**Note**: After builds succeed, coordinate with stakeholders for targeted manual validation (CLI, TUI, BYOK auth).


### Lesson Learned: Align Versioning and Generated Assets Early
- As soon as the roll-forward lands, set `workspace.package.version` (and any packaged CLI/SDK manifests) to the upstream release number. This keeps the CLI status banner, telemetry headers, and downstream tooling consistent.
- Replace hard-coded `"0.0.0"` / `"0.0.0-dev"` placeholders in tests and telemetry with `env!("CARGO_PKG_VERSION")` so future bumps require zero code edits.
- Regenerate any OpenAPI/TypeScript bindings (`app-server-protocol/bindings`, MCP types) immediately after the version bump and stage them in the same commit to avoid drift.
- Capture these adjustments in the execution log so future agents know they happened before validation began.

## Key Areas to Monitor for Breaking Changes

When upgrading, the following areas are the most likely sources of conflicts and breakages.

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

### 5. Model Switching & BYOK Auth

-   **What it is**: Downstream now relies on `Op::OverrideTurnContext` to propagate both the model slug and provider ID so sessions can swap providers mid-conversation (e.g., OpenAI ↔ Z.AI ↔ OSS) without restarting.
-   **Potential Breakage**:
    -   Upstream changes to `OverrideTurnContext` fields or session configuration merging can silently drop provider overrides.
    -   Provider metadata (`model_provider_id`, `ModelProviderInfo`) can drift if upstream reorganises config loading.
-   **Action Plan**:
    1.  Audit `SessionConfiguration::apply`, `Session::make_turn_context`, and `ModelClient::new` for signature or behaviour changes; ensure provider ID and info are kept in sync.
    2.  Verify that BYOK models (e.g., Z.AI’s `glm-4.6`) still respond after switching away from and back to OpenAI within the same conversation.
    3.  When downstream code needs to suppress Clippy lint noise (e.g., deliberate `map(|info| info.clone())` fallbacks), prefer `#[expect(...)]` with a rationale instead of `#[allow]` so future roll-forwards get alerted if the lint stops triggering.
    4.  Update the design docs if the override contract changes so future phases know the new expectations.
