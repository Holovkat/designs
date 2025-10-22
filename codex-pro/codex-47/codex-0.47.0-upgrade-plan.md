# Codex 0.47.0 Upgrade Plan

## Context
- **Target release:** `rust-v0.47.0` from [`openai/codex`](https://github.com/openai/codex).
- **Current baseline:** `codex-pro` fork (HEAD `9f255e71b5db`), derived from a pre-0.47.0 workspace with manual-only workflow triggers and downstream agentic customisations.
- **Goal:** Inventory all upstream 0.47.0 changes and outline the tasks required to bring this fork to parity while preserving local customizations.

## High-Level Checklist
- [ ] Sync workspace metadata (`AGENTS.md`, issue templates, workflows, `codex-cli` bundle); decide whether to retain manual-only workflow triggers introduced in `9f255e7`.
- [ ] Update Rust workspace manifests and lockfile (add `codex-feedback`, refresh dependency versions).
- [ ] Port new configuration and feature-flag system (`core/src/config.rs`, `core/src/features.rs`, `common/src/format_env_display.rs`).
- [ ] Adopt MCP resource tool handler and related protocol changes.
- [ ] Integrate exec/approval flow updates (auto-approve toggles, parsed command metadata, log upload support).
- [ ] Merge cloud tasks CLI enhancements (allow queue creation, policy updates, log streaming).
- [ ] Refresh MCP client/server changes (OAuth prompts, headers, cwd/env overrides).
- [ ] Pull in RMCP client enhancements and new test harness binaries.
- [ ] Incorporate TUI changes (feedback view, update prompt, editor UX fixes, styling snapshots).
- [ ] Add new `feedback` crate and hook UI/backend integration points.
- [ ] Update documentation (`docs/config.md`, MCP docs) and release automation.
- [ ] Run formatting, linting, and targeted test suites per crate; address snapshot updates.

## Detailed Steps

### 1. Baseline & Tooling Alignment
1. Ensure the upstream remote is configured (`git remote add upstream git@github.com:openai/codex.git` if missing) and fetch the `rust-v0.47.0` tag plus the latest `main`; capture commit list for traceability.
2. Generate an upstream diff against the current fork (`git diff --stat upstream/rust-v0.47.0...HEAD`, `git diff upstream/rust-v0.47.0...HEAD -- <crate>`), and record a feature-by-feature comparison table (core/config, tooling, exec, MCP, TUI, feedback, workflows) to guide implementation on `codex-47-alignment`.
3. Audit differences in `.github` workflow files and issue templates; port notarization and manual release triggers, reconciling with our current workflow-dispatch-only setup before enabling automation.
4. Add/merge root `AGENTS.md` instructions if missing to keep contributor guidance in sync.
5. Refresh `codex-cli/bin/codex.js` to include the latest auto-update banner and Bun detection logic.

### Comparison Snapshot (analysis captured 2025-10-22)

| Area | Upstream `rust-v0.47.0` highlights | Current fork (`9f255e7`) | Integration notes |
| --- | --- | --- | --- |
| Workflows & metadata | Automated CI/release pipelines, updated issue templates, VSCode settings streamlined | Manual-only workflow triggers, additional agentic documentation | Decide whether to restore automation or keep manual dispatch; reconcile `.github/*` deltas before merge |
| Workspace manifests | `workspace.package.version = "0.47.0"`, new `codex-feedback` crate, dependency bumps (`tokio`, `reqwest`, `serde`, etc.) | Version `0.46.0`, no feedback crate, agentic-specific crates present | Bump versions, add feedback crate, regenerate lockfile while preserving `codex-agentic-*` crates |
| Config & features | Centralised `Features` API, new helpers (`common/format_env_display.rs`), TOML `[features]` tables | Legacy boolean flags, BYOK/index overrides in `codex-agentic-core` | Map agentic settings onto `Features`, update settings/BYOK code, ensure env redaction uses shared helper |
| Tools & MCP | New `mcp_resource` handler, expanded `read_file`, protocol metadata updates, additional tests | Handler absent, older tool specs | Cherry-pick new handlers/specs; ensure agentic tool wrappers remain compatible |
| Exec & approvals | Auto-approve toggles, parsed command metadata, log upload telemetry, updated CLI prompts | Custom agentic commands, older approval flow | Merge upstream logic, then reapply agentic approvals/recipes; expect conflicts in `cli/src/main.rs` & `codex-agentic-core` |
| Cloud tasks | Queue creation, IAM binding helpers, structured output | Older CLI, minimal queue helpers | Port features while keeping any fork-specific defaults |
| MCP client/server | OAuth prompt UX, header overrides, cwd/env options | Custom ACP integration via `codex-agentic-core`; older upstream code | Merge upstream updates, ensure agentic ACP entrypoints still compile (new CLI subcommand split) |
| RMCP client | Enhanced OAuth flow, utility refactors, new test harness binaries | Older RMCP logic, custom agentic hooks | Reconcile with agentic additions; regenerate fixtures as needed |
| TUI | Feedback overlay, update prompt rework, composer shortcuts, expanded status widgets | Agentic index overlay, custom UI tweaks, no feedback view | Carefully merge overlays; plan to refresh snapshots and keep index status widgets intact |
| Feedback | Dedicated `codex-rs/feedback` crate, CLI/TUI integration points, opt-in gating | Absent | Introduce crate, wire toggles through agentic settings, confirm telemetry requirements |
| Docs & SDK | `docs/config.md` covering features/feedback, TypeScript items updated | Older docs, custom agentic README sections | Merge docs while preserving downstream guidance; regenerate SDK bindings if required |

> Commands used for this comparison (analysis only):  
> `git fetch --depth=1 https://github.com/openai/codex.git rust-v0.47.0`  
> `git diff --stat FETCH_HEAD`  
> `git diff FETCH_HEAD -- <path>` as needed per feature area.

### 2. Workspace Manifest & Dependencies
1. Mirror changes in `Cargo.toml` and `Cargo.lock`, ensuring the new `codex-feedback` crate and updated dependency versions (e.g., `serde`, `reqwest`, `tokio`) match upstream.
2. Reconcile any fork-specific dependency overrides or patched crates before regenerating the lockfile with `cargo metadata` parity.
3. Confirm workspace members list ordering and inclusion matches upstream to avoid missing crates during builds.

### 3. Configuration & Feature Flags
1. Replace or merge `core/src/config.rs`, `config_profile.rs`, and `config_types.rs` with upstream versions introducing the centralized `Features` API.
2. Add new `core/src/features.rs` and `core/src/features/legacy.rs`; ensure `core/src/lib.rs` wires the module.
3. Introduce `common/src/format_env_display.rs` and export helpers for consistent env redaction.
4. Update CLI/config consumers (e.g., `cli/src/mcp_cmd.rs`, `core/src/codex.rs`) and downstream overlays (`codex-agentic-core/src/settings.rs`, provider/index modules) to use `Features` assessment instead of scattered boolean fields.
5. Ensure TOML parsing logic adopts `[features]` table support and merge profile overrides while preserving agentic defaults and BYOK overrides.

### 4. Tooling & MCP Resource Support
1. Add `core/src/tools/handlers/mcp_resource.rs` and register it in `core/src/tools/handlers/mod.rs`.
2. Update `core/src/tools/handlers/read_file.rs` with new indentation and chunking behavior.
3. Adjust protocol structs (`protocol/src/parse_command.rs`, `protocol.rs`) to include path metadata and resource calls.
4. Align `core/src/tools/spec.rs` and `core/src/tools/mod.rs` definitions with new handlers and response payloads.
5. Merge new tests in `core/tests` covering tool harness, shell serialization (regex-based fixtures), and responses headers.

### 5. Exec & Approval Flow Enhancements
1. Incorporate `core/src/exec.rs`, `executor` modules, and `core/src/state/turn.rs` changes enabling auto-approval and parsed command capture.
2. Pull in log upload support (new events, `core/src/user_notification.rs`, CLI surfaces) and ensure telemetry wires through `otel/`.
3. Sync `exec/tests/suite/approve_all.rs` and update `exec/src/lib.rs` to expose new APIs.
4. Merge CLI changes (`cli/src/main.rs`, `cli/src/mcp_cmd.rs`) providing auto-update prompts and improved login flows, reconciling them with the `codex-agentic` binary (`cli/src/bin/codex-agentic.rs`) and `agentic_commands` registry.

### 6. Cloud Tasks Integration
1. Update `cloud-tasks` crate (`src/lib.rs`, `src/cli.rs`, `src/util.rs`) with queue management, IAM bindings, and structured output.
2. Ensure any project-specific Google Cloud configuration is reflected post-merge.
3. Refresh tests or create stubs mirroring upstream expectations.

### 7. MCP Client & Server Updates
1. Apply enhancements in `mcp-client` and `mcp-server` (OAuth prompts, cwd/env overrides, custom headers).
2. Update associated tests (`mcp-client/src/mcp_client.rs`, `mcp-server/tests/suite/codex_tool.rs`) for new behaviors.
3. Confirm new protocol events are compatible with existing harness integrations.

### 8. RMCP Client Improvements
1. Merge new binaries (`rmcp-client/src/bin/test_stdio_server.rs`, `test_streamable_http_server.rs`) and utilities.
2. Update `rmcp-client/src/utils.rs`, `auth_status.rs`, and login flows to match upstream.
3. Include newly added tests and fixtures for OAuth/resource validation.

### 9. TUI Enhancements
1. Pull in composer quality-of-life changes (Ctrl+Y, CapsLock shortcuts, history cursor reset) and margin fixes.
2. Integrate new feedback overlay (`bottom_pane/feedback_view.rs`) and update prompt modal (`tui/src/update_prompt.rs`).
3. Update approval overlays to prompt for full-access confirmation and effort usage warnings while keeping downstream index/status overlays functional.
4. Sync snapshots under `tui/src/**/snapshots` and rerun `cargo insta` acceptance once UI drift is acknowledged; expect conflicts with agentic overlay snapshots.
5. Review `tui/styles.md` to confirm style helpers remain consistent post-merge.

### 10. Feedback Crate Integration
1. Add the `codex-rs/feedback` crate (manifest + `src/lib.rs`) and wire it into the workspace.
2. Ensure `core`, `tui`, and CLI components call into feedback APIs where upstream does, and evaluate how agentic overlays should expose feedback entry points.
3. Evaluate environment or feature toggles gating feedback collection in `Config`.

### 11. Documentation Updates
1. Add/merge upstream `docs/config.md` covering feature flags, approval flows, and MCP resource usage.
2. Update any fork-specific docs to reference new configuration keys (`features.unified_exec`, `features.web_search_request`, etc.).
3. Reconcile `docs/codex_mcp_interface.md` if upstream adjustments exist post-0.47.0.

### 12. Verification & Release Prep
1. Run `just fmt` and targeted `just fix -p <crate>` for every touched crate.
2. Execute crate-specific test suites (`cargo test -p codex-core`, `-p codex-tui`, `-p codex-exec`, `-p codex-mcp-client`, etc.).
3. Update and accept snapshot tests after visually confirming UI changes.
4. Perform end-to-end smoke tests (CLI login, MCP resource listing, exec approval flows, feedback submission).
5. Confirm release workflows succeed locally (dry-run) and bump fork-specific version tags as needed, noting deviations if we retain manual-only triggers.

## Additional Considerations
- Preserve any fork-specific patches (agentic CLI commands, semantic index wiring, BYOK provider overrides) by replaying them after cherry-picking upstream commits or during manual merges.
- Document deviations from upstream (e.g., custom auth providers, manual workflow triggers) so they can be re-applied post-upgrade.
- Coordinate with stakeholders before enabling new experimental features (unified exec, streamable shell, approve-all) in production environments.
- Schedule time for regression testing in sandbox and production-like setups, especially around MCP integrations and auto-approval flows.
- If downstream tooling reads generated schemas or TypeScript bindings (`sdk/typescript/src/items.ts`) or bespoke agentic prompts, ensure updates are propagated there as well.
- Add a pre-merge checkpoint to review CLI and TUI diffs against the agentic variants before final integration.
