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

### 2. BYOK Providers & Guardrails (Never Skip)

-   **What it is**: Our fork exposes BYOK providers (custom endpoints, private keys, Azure overrides) everywhere—CLI `/models`, `/agent`, `/index`, TUI picker overlays, and the approval/login flows. These pieces live across `codex-agentic-core`, `cli`, `tui`, and the docs.
-   **Potential Breakage**:
    -   Upstream refactors drop `provider_id`, `custom_providers`, or cached BYOK model metadata when merging new `/models list` or `/turn` APIs.
    -   Slash-command guardrails (`/index`, `/memory`, `/agent`) get overwritten, letting upstream defaults hide BYOK-only options.
    -   Docs or prompts forget to mention BYOK setup, so the next roll-forward removes the plumbing entirely.
-   **Action Plan**:
    1.  Before applying each upstream commit batch, note every place it touches model selection, provider metadata, or slash commands. Diff against `codex-agentic-core`, `cli/src/main.rs`, and `tui/src/chatwidget.rs` so any dropped guardrails can be reapplied immediately.
    2.  After merges, run `/models list`, `/agent`, `/index build`, and the TUI picker inside a BYOK-configured workspace (even if broader testing is deferred) to confirm downstream provider names/descriptions still render.
    3.  Update `docs/advanced.md`, `16-CUSTOM-PROVIDERS-BYOK.md`, and this guide whenever BYOK-specific behaviour changes so future agents know which files must never be left “upstream default”.
    4.  Log every BYOK reconciliation step in the alignment checklist + upgrade plan execution log (commit IDs, commands, outstanding smokes). If something must be deferred, explicitly state which BYOK scenario still needs coverage.

### 3. Core Crate API (`codex-core/codex-rs/core`)

-   **What it is**: Your custom crates (`codex-agentic`, `codex-acp`) directly call public functions and use data structures from the `codex-core` library.
-   **Potential Breakage**:
    -   Changes to function signatures, structs, or enums (e.g., `Session`, `Event`).
    -   Modules are moved or reorganized, breaking `use` statements.
-   **Action Plan**:
    1.  Use the `cargo check` output as your guide.
    2.  Methodically fix compilation errors by updating function calls, struct initializations, and `use` paths to match the new v0.44 API.

### 4. Configuration (`config.toml`)

-   **What it is**: `macicodex` relies on the configuration keys defined by `codex-core` and adds its own.
-   **Potential Breakage**:
    -   Upstream renames, removes, or changes the accepted values for keys like `model_provider`, `sandbox_mode`, or `approval_policy`.
    -   New mandatory configuration keys are introduced.
-   **Action Plan**:
    1.  Carefully `diff` the new `codex-core/docs/config.md` against the previous version.
    2.  Update any logic in `codex-agentic` that sets or reads configuration values.
    3.  Test your custom configuration recipes (e.g., `--yolo-with-search`) to ensure they still work.

### 5. Agent Prompts (`prompt.md`)

-   **What it is**: The system prompts in `codex-core/codex-rs/core/` define the agent's core behavior, personality, and tool-use logic.
-   **Potential Breakage**:
    -   Changes in tool-use instructions could affect how the agent interacts with your custom-injected search results.
    -   Changes to the expected output format could break features that parse the agent's responses.
-   **Action Plan**:
    1.  `diff` the new `prompt.md` and `gpt_5_codex_prompt.md` files.
    2.  Perform end-to-end testing on your key features (like `/about-codebase` and `/search`) to check for behavioral regressions.

### 6. Model Switching & BYOK Auth

-   **What it is**: Downstream now relies on `Op::OverrideTurnContext` to propagate both the model slug and provider ID so sessions can swap providers mid-conversation (e.g., OpenAI ↔ Z.AI ↔ OSS) without restarting.
-   **Potential Breakage**:
    -   Upstream changes to `OverrideTurnContext` fields or session configuration merging can silently drop provider overrides.
    -   Provider metadata (`model_provider_id`, `ModelProviderInfo`) can drift if upstream reorganises config loading.
-   **Action Plan**:
    1.  Audit `SessionConfiguration::apply`, `Session::make_turn_context`, and `ModelClient::new` for signature or behaviour changes; ensure provider ID and info are kept in sync.
    2.  Verify that BYOK models (e.g., Z.AI’s `glm-4.6`) still respond after switching away from and back to OpenAI within the same conversation.
    3.  When downstream code needs to suppress Clippy lint noise (e.g., deliberate `map(|info| info.clone())` fallbacks), prefer `#[expect(...)]` with a rationale instead of `#[allow]` so future roll-forwards get alerted if the lint stops triggering.
    4.  Update the design docs if the override contract changes so future phases know the new expectations.

### 7. TUI Model Picker Must Keep BYOK Entries Intact

- **What it is**: The TUI’s `/model` popup combines upstream presets with downstream BYOK providers by calling `collect_model_presets()`, which in turn depends on helpers such as `custom_model_presets()`, `reasoning_presets_for_kind()`, and `describe_custom_provider()`. These functions stitch together cached models, provider labels, and reasoning defaults so that entries like `glm-4.6 (z.ai)` appear right alongside OpenAI options.
- **Potential Breakage**:
    - Accidentally deleting the helper stack (for example during a large renderable refactor) leaves only the builtin presets, so every BYOK model silently vanishes even though refresh logs still say “Refreshed models for `zai`…”.
    - Removing the provider-aware metadata (e.g., `provider_id` on `ModelPreset`) means selecting a BYOK model switches back to OpenAI because the override no longer carries the custom provider ID.
- **Action Plan**:
    1. When cherry-picking TUI changes, ensure `collect_model_presets`, `custom_model_presets`, `reasoning_presets_for_kind`, and `describe_custom_provider` all land together. If upstream renames or moves them, recreate equivalent helpers downstream before deleting the old ones.
    2. After any TUI refactor, run `/model` in a BYOK workspace (or `cargo test -p codex-tui -- model_popup_lists_custom_provider_models`) to confirm entries like `glm-4.5 (z.ai)` still render.
    3. Verify that the `ModelPreset` generated for a custom provider carries `provider_id: Some("zai")`; the reasoning popup should re-use that ID when sending `Op::OverrideTurnContext`. If the ID is `None`, the CLI/TUI will fall back to OpenAI mid-session.
    4. Capture any fixes or regressions in the alignment checklist/execution log so future agents know why this wiring matters; this reminder exists because we once regressed it during the Phase 2 renderable merge.
    5. Keep the `ChatWidget` snapshot of providers in sync with `settings` (today via `chat_widget.sync_custom_providers(custom_providers(&settings))`) every time BYOK data changes—refresh events and `/byok` edits must push the updated map into the widget, not just disk.
    6. During manual validation, run `/byok` → “Refresh models” for a custom provider and immediately open `/model` to ensure the refreshed entries (with provider labels) appear; call out the result in the alignment plan.

### 8. `/index` and `/memory` Slash Commands Need Guardrails

- **What it is**: Downstream relies on the `/index` and `/memory` slash commands to surface custom UI (semantic index rebuild orchestration and the memory manager overlay). The commands live in `tui/src/slash_command.rs`, dispatch through `ChatWidget::dispatch_command`, and ultimately send `AppEvent::StartIndexBuild` or `AppEvent::OpenMemoryManager` to `App::update`. When these events disappear, the CLI/TUI loses its rebuild + memory tooling even though the slash commands still autocomplete.
- **Potential Breakage**:
    - Cherry-picking upstream TUI changes that remove or rename the slash command variants, or leave them default-enabled during tasks, can make `/index` silently no-op.
    - Refactors that drop the `AppEvent` wiring (e.g., removing `AppEvent::StartIndexBuild` handling in `app.rs`) produce UI toasts but never start the index worker.
    - Memory manager invocations can be broken by removing `SlashCommand::Memory` or by gating it incorrectly when a task is running.
- **Action Plan**:
    1. Keep `SlashCommand::IndexBuild` and `SlashCommand::Memory` defined, documented, and (for `/index`) marked as `available_during_task == false` so we never try to rebuild while Codex is mid-turn.
    2. Ensure `ChatWidget::dispatch_command` continues to send `AppEvent::StartIndexBuild` and `AppEvent::OpenMemoryManager`. We added regression tests (`slash_index_build_triggers_start_index_build_event` / `slash_memory_opens_memory_manager`) in `tui/src/chatwidget/tests.rs`; run or update them after large TUI merges.
    3. When touching `AppEvent` handling in `tui/src/app.rs`, keep the `StartIndexBuild` branch wired to `start_index_build()` and leave the memory manager path (`run_memory_manager`) reachable from both `/memory` and the UI buttons.
    4. Call out any intentional behaviour change (e.g., disabling `/memory` while tasks run) in the alignment plan + release notes before landing to avoid silently regressing downstream workflows.
    5. During validation, invoke `/index build` and `/memory` while idle and while a turn is running to prove the guardrails still fire (index refuses mid-task, memory manager remains accessible only when safe).
