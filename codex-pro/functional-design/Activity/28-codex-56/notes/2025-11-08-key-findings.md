# 2025-11-08 — Key upstream findings (rust-v0.56.0)

## App-server v2 surfaces
- Commits `edf4c3f62`, `2ab1650d4`, `05f0b4f59`, `229d18f4d`, `658255492`, `1b8cc8b62`, and `fdb9fa301` collectively add v2 account/login/thread/turn APIs, expand exports, and relocate suites under `tests/suite/v2/*`.
- `app-server-protocol` now emits v2 TypeScript + JSON schemas under a dedicated namespace, so downstream bindings must mirror the folder layout and re-export style to avoid breaking CLI consumers.
- `codex_message_processor.rs` gains new turn handlers that unify the previously separate `SendUserMessage`/`SendUserTurn` paths. Downstream CLI overrides (model/provider/approval policy) need regression coverage to ensure the v2 wrappers still accept sidecar-only fields.
- Mock infrastructure shifts: `tests/common/mcp_process.rs`, rollout helpers, and new `ResponseMock` utilities expect additional metadata (session summaries, v2 account notifications). Reuse these when adapting downstream tests to reduce duplication.
- Validation impact: after each batch run `cargo test -p codex-app-server` (plus `-- --ignored`) and rerun CLI `/login`/`/approve` against the mocked server to confirm the new metadata surfaces do not break BYOK auth flows.

## Core context manager & prompt loading
- Commit `1a89f7001` replaces `core/src/conversation_history.rs` with a modular `context_manager/` directory (history pipeline, normalization helpers, truncation). Downstream semantic-index integrations should call into the new APIs instead of the deleted monolith.
- History tests moved into `core/src/context_manager/history_tests.rs` (841 LOC). Use them as reference before extending downstream tests—prefer comparing entire structs per AGENTS guidance.
- Commit `fff576cf9` teaches `custom_prompts.rs` to follow symlinks via `fs::metadata`, plus adds a Unix-only regression test and updates `docs/prompts.md`. Downstream prompt injection (AGENTS.md overlays, semantic search prompt) must respect the same symlink semantics to avoid duplicate file walkers.
- Seatbelt + sandbox wideners (`8501b0b76`) touch `core/src/seatbelt.rs`, `seatbelt_network_policy.sbpl`, and CLI `debug_sandbox.rs`. BYOK credential initialization (which shells out under seatbelt) should be re-tested with network-enabled sandboxes to ensure certificate operations succeed while still honoring downstream env guards.
- Validation: `just fix -p codex-core`, `cargo test -p codex-core --all-features`, plus targeted `codex debug seatbelt --full-auto` smoke with network toggled on macOS/Linux. Document any tests skipped due to sandbox env vars.

## TUI renderables & Windows sandbox UX
- Commit `62474a30e` refactors `tui/src/chatwidget.rs`, `bottom_pane/*`, and `render/renderable.rs` to use shared Renderables, touching dozens of snapshots. Downstream semantic index overlays and approval UI customizations must be re-applied after the refactor; expect large `.snap.new` diffs that need manual review via `cargo insta show`.
- Commits `d4eda9d10` and `86c149ae8` tweak input/event handling (preventing stray `r` capture and ensuring the login menu stays open). Downstream shortcut patches (e.g., `/lightmem`, `/delegate`) need retesting to confirm they still exit modals correctly.
- Windows sandbox warning (`871d442b8`) wires new detection logic into `windows-sandbox-rs/src/audit.rs` and surfaces UI banners through `tui/src/app.rs` + `chatwidget.rs`. Downstream documentation should mention the new warning, and QA must capture screenshots confirming it appears only when Everyone-writable directories exist.
- Validation: `cargo test -p codex-tui`, `cargo insta pending-snapshots -p codex-tui`, manual TUI runs for `/index build`, approval overlay, login modal, and Windows sandbox banner. Capture reasons for any snapshot acceptances in the upgrade plan.
