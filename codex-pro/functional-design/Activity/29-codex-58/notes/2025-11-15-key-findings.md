# 2025-11-15 — Codex 0.58 Upstream Key Findings (Planning Stub)

## Core/context manager & protocol
- Context manager refactor replaces the legacy `conversation_history` module with `context_manager::{history,normalize,truncate}`; downstream semantic overlay/lightmem hooks must migrate to the new APIs without dropping truncation controls.
- Protocol v2 adds `account/read`, richer `thread/resume` inputs (history/path/overrides), and lifecycle events for thread items. Downstream proxies + CLI/TUI consumers need schema updates and regression tests mirroring upstream suites.
- GPT-5.1 prompt + model metadata updates touch `core::model_family`, config editing flows, and `gpt_5_1_prompt.md`; ensure downstream prompts/presets stay aligned with BYOK + semantic overlay defaults.

## CLI/TUI surfaces
- CLI introduces gpt-5.1 NUX, rate-limit nudges, login-exit fallback, seatbelt debug UI, and WSL path normalization. Need to reconcile with downstream slash commands and exec approval gating without regressing prompts.
- TUI adds job-control refactors, inline approval shortcuts, model migration prompt overlays, and status card tweaks. Expect snapshot churn; plan for `cargo test -p codex-tui` + `cargo insta pending-snapshots -p codex-tui` after merging.
- Model picker copy/layout changes plus new reasoning levels require verifying CLI/TUI composer prompts and downstream semantic overlay hints.

## Exec, MCP, and sandbox
- Unified exec gains workdir plumbing, escalation handling, and fallback shell tool removal when unified exec is enabled; ensure downstream exec approval toggles stay intact.
- Seatbelt/sandbox changes include codex-linux-sandbox integration, PID tracking, and policy tweaks (e.g., `hw.physicalcpu` reads). Need to run macOS + Linux sandbox smokes and keep telemetry wiring.
- MCP docs + TypeScript SDK add network/web-search options and auth clarifications; mirror in downstream `mcp-client`, `mcp-server`, and SDK overlays.

## Docs & templates
- Config docs update shell/model family sections, generate-ts guidance, and web-search config instructions. Mirror while retaining downstream AGENTS guidance.
- Release automation adds `--promote-alpha`, Windows packaging improvements, and CLI auto-update fixes. Determine which apply to codex-pro release tooling.

## Open questions & follow-ups
- Need stakeholder sign-off on validation cadence (especially `cargo test --all-features`, SDK tests, and manual smokes for sandbox flows).
- Define Windows/Linux sandbox manual coverage expectations (seatbelt denial reproduction, exec approval flows) and document them before Phase 5.
- TUI snapshot triage workflow still pending; outline reviewer rotation + acceptance steps before Phase 4 coding begins.
