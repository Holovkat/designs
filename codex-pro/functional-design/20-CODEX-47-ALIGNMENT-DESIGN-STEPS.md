# 20 — Codex 0.47 Alignment Design Steps

## Purpose
Document the staged approach for updating the `codex-pro` fork to match upstream release `rust-v0.47.0`, while retaining all existing custom behavior. This guide complements:
- Upgrade checklist: `designs/codex-pro/codex-47/codex-0.47.0-upgrade-plan.md`
- Dev agent prompt: `designs/codex-pro/codex-47/codex-47-development-agent-prompt.md`

Use this document to coordinate engineering and QA workstreams, ensuring each phase is verified before progressing.

---

## Phase 0 – Preparation
- Confirm branch strategy: create and work exclusively on `codex-47-alignment`.
- Fetch upstream tag `rust-v0.47.0` for reference; avoid merging or rebasing the default branch until validation completes.
- Inventory local customizations (workspace manifests, CLI flags, TUI tweaks, MCP integrations) to verify preservation later.
- Revisit tooling requirements: latest `just`, `cargo-insta`, `cargo` nightly (`rust-toolchain.toml`), and any platform-specific prerequisites.
- Ensure the upstream remote exists (`git remote add upstream git@github.com:openai/codex.git` if missing), fetch `upstream/rust-v0.47.0` and `upstream/main`, and produce a feature-by-feature comparison (core/config, tools, exec/approval, cloud/MCP, RMCP, TUI, feedback, workflows) summarising the diff; document the results in the “Comparison Snapshot” table within the upgrade plan and cross-link key actions here.

## Phase 1 – Workspace & Metadata Sync
1. Update repo metadata (`AGENTS.md`, issue templates, CI workflows) aligning with upstream while deciding whether to keep manual-only workflow triggers or adopt upstream automation.
2. Refresh `codex-cli` bundle scripts with upstream improvements (Bun detection, update banners).
3. Adjust documentation stubs (`docs/config.md`, release notes indices) without overwriting fork-specific content.

## Phase 2 – Dependency & Manifest Alignment
1. Mirror upstream updates in `Cargo.toml` and `Cargo.lock`, bumping the workspace/package version from `0.46.0` to `0.47.0`, adding the new `codex-feedback` crate, and applying dependency bumps so `codex-agentic` stays in lockstep with upstream `codex`.
2. Preserve fork overrides (e.g., patched crates, feature flags). Reconcile conflicts manually before regenerating the lockfile.
3. Run `just fmt` and `just fix -p` for any crates touched; record outcomes for the final report.

## Phase 3 – Core Configuration & Features
1. Integrate `core/src/config.rs`, `config_profile.rs`, `config_types.rs` changes enabling the `Features` registry.
2. Add new modules `core/src/features.rs` and `core/src/features/legacy.rs`; wire them into `core/src/lib.rs`.
3. Introduce `common/src/format_env_display.rs` and ensure all consumers (CLI, core) and agentic overlays use the shared helper.
4. Update CLI entrypoints (`cli/src/main.rs`, `cli/src/mcp_cmd.rs`, `cli/src/bin/codex-agentic.rs`) to respect feature overrides, profile inheritance, and new flags; reconcile changes with the agentic command registry and provider/index settings in `codex-agentic-core`.
5. Extend test suite coverage (`core/tests/common`, `core/tests/responses_headers.rs`) and validate via `cargo test -p codex-core`.

## Phase 4 – Tooling & MCP Resource Support
1. Add `core/src/tools/handlers/mcp_resource.rs` and register it in handler modules.
2. Merge adjustments in `read_file` tooling (indentation mode, chunking) and expand schema definitions in `core/src/tools/spec.rs`.
3. Update protocol definitions (`protocol/src/parse_command.rs`, `protocol.rs`) to include new metadata fields.
4. Run targeted tests: `cargo test -p codex-protocol` and affected integration suites.

## Phase 5 – Exec, Approval, and Telemetry Enhancements
1. Port auto-approval logic, parsed command capture, and log upload workflows across `core/src/exec.rs`, `executor`, and `exec` crates.
2. Reflect new events in `core/src/user_notification.rs` and `otel/src/otel_event_manager.rs`.
3. Update `exec` crate tests (`approve_all.rs`, integration harness) and execute `cargo test -p codex-exec`.

## Phase 6 – Cloud Tasks & MCP Client/Server
1. Merge `cloud-tasks` CLI enhancements (queue creation, IAM bindings) and validate with `cargo test -p codex-cloud-tasks`.
2. Port MCP client/server adjustments (OAuth prompts, headers, cwd/env overrides) ensuring existing hooks remain intact.
3. Execute targeted suites: `cargo test -p codex-mcp-client`, `cargo test -p codex-mcp-server`.

## Phase 7 – RMCP Client & Supporting Utilities
- Add new binaries (`test_stdio_server`, `test_streamable_http_server`) and utilities.
- Sync login flows, auth status handling, and header propagation.
- Run `cargo test -p codex-rmcp-client` and confirm binary invocation scripts still work with fork-specific settings.

## Phase 8 – TUI Integration & Snapshots
1. Apply TUI updates: feedback overlay, update prompt modal, composer shortcuts, margin adjustments, merging carefully with semantic index overlays from `codex-agentic-core`.
2. Review snapshots under `tui/src/**/snapshots` after running `cargo test -p codex-tui`; expect conflicts with agentic overlay snapshots and accept updates via `cargo insta accept -p codex-tui` only after manual inspection.
3. Confirm styling helpers remain consistent with `tui/styles.md`, local custom themes, and agentic color usage.

## Phase 9 – Feedback Crate & UI Hooks
- Add `codex-rs/feedback` crate and integrate with core logic, CLI prompts, TUI feedback view, and agentic overlays.
- Ensure telemetry/feature flag plumbing respects existing opt-in requirements.
- Run dependent crate tests (`cargo test -p codex-feedback`, plus integration suites touching feedback flows).

## Phase 10 – Documentation & Final Verification
1. Update or cross-reference documentation: `docs/config.md`, MCP interface docs, fork-specific READMEs.
2. Execute full build: `cargo build --all-features` and `cargo build -p codex-cli --bin codex-agentic`.
3. Smoke-test CLI binary on `codex-47-alignment`: login, MCP resource listing, exec approvals, feedback submission.
4. Re-run any fork-specific automated checks (`just` tasks, release scripts) applicable to your deployment pipeline.
5. Prepare final handoff summary with:
   - Change overview and confirmation of preserved customizations.
   - Commands executed (fmt, fix, tests, builds) and their outcomes.
   - Confirmation that binary launch and key scenarios succeed.

## Phase 11 – QA & Handoff
- Provide branch `codex-47-alignment` and summary to stakeholders for validation.
- Capture QA feedback, address identified issues on the same branch, and update documentation as needed.
- Once approved, coordinate merge strategy (squash, merge commit, or rebase) ensuring upstream repo remains untouched until sign-off.

---

### Checklist Snapshot
- [ ] Branch `codex-47-alignment` created and isolated.
- [ ] Upstream tag `rust-v0.47.0` referenced without altering upstream remote.
- [ ] All phases 0–10 completed with tests logged.
- [ ] CLI binary smoke-tested successfully.
- [ ] Final handoff package delivered for QA approval.
