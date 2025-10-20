# 15 — Usage Window & Rate-Limit Enhancements (2025‑10‑10)

## Overview
We unified all “usage window” logic (5 h, weekly, etc.) behind a reusable helper crate and extended every surface that exposes rate-limit data (TUI status card/footer and `codex-exec` output modalities). This closes the gap introduced when usage-window statistics were first surfaced in `/status` and ensures the CLI surfaces emit consistent telemetry to downstream automation.

## Key Changes

### Shared Rate-Limit Classification (`codex-rs/common`)
- Added `common/src/rate_limits.rs` exporting `RateLimitWindowKind` plus `resolve_window_kind` helpers and label formatters (short/long/title cases).
- Consumers now depend on canonical labels instead of duplicating heuristics (the original `get_limits_duration` in `tui::chatwidget` was removed).

### TUI Status Card & Footer (`codex-rs/tui`)
- `RateLimitWindowDisplay` now stores a fallback window kind and derives the display labels via the shared helper.
- `/status` card rows display title-cased window names (e.g. “5h limit”, “Weekly limit”).
- Added `compose_rate_limit_footer` helper that distills snapshot data into compact footer summaries (e.g. `72% 5h`, `45% Wk`), trimming reset timestamps for readability.
- Footer props include `rate_limit_summaries`; the footer renders `context_left · <each summary>` while still supporting shortcut hints and the index status line.
- When new rate-limit snapshots arrive, the chat widget populates both the status card data and the footer summaries (and clears them when the snapshot is unavailable).
- Updated TUI snapshots under `tui/src/status/snapshots/…` to reflect the new verbiage.

#### Implementation Notes
- `tui/src/bottom_pane/footer.rs`: `FooterProps` gained the `rate_limit_summaries` field and `context_and_limits_line()` builds the `"<percent>% context left · …"` sequence. The logic is wired into `footer_lines()` so every mode except the shortcut overlay displays the summaries alongside the context meter.
- `tui/src/bottom_pane/mod.rs` and `tui/src/bottom_pane/chat_composer.rs`: new setter `set_rate_limit_summaries` threads the summaries down into the footer props.
- `tui/src/chatwidget.rs`: `on_rate_limit_snapshot` calls `compose_rate_limit_footer` and forwards its vector to the bottom pane via `set_rate_limit_summaries`, ensuring the footer updates whenever the backend emits fresh usage data.

### Exec Human Output (`codex-rs/exec`)
- `EventProcessorWithHumanOutput` keeps the latest `RateLimitSnapshot` and prints a “rate limits” section during `print_final_output`, emitting human-readable lines (e.g. `72% of 5h limit (resets in 10m)`).
- Reset durations are normalized (h/m/s) for concise output.
- Ensured we only print summaries when at least one window is present, avoiding noise when snapshots are missing.

### Exec JSON Output (`codex-rs/exec`)
- Introduced `RateLimitUsage` / `RateLimitWindowUsage` in `exec_events.rs`; `Usage.rate_limits` now serializes the latest snapshot structure (primary/secondary windows).
- The JSON event processor converts snapshots into the new structure before emitting `turn.completed`.
- Extended `event_processor_with_json_output.rs` tests to assert both the existing usage fields and the new `rate_limits` payload.

## Tests & Tooling
- `just fmt`
- `just fix -p codex-common`
- `just fix -p codex-tui`
- `just fix -p codex-exec`
- `cargo test -p codex-tui`
- `cargo test -p codex-exec`
- `cargo test --all-features` *(fails on `codex-core/tests/suite/cli_stream::*` because the harness now requires `cargo run --bin codex`; document left the known failure for follow-up).*

## Follow-Ups
- Teach the CLI stream tests to pass `--bin codex` (or set `default-run`) so workspace-wide test runs are clean again.
- Expose the footer summaries in the CLI `/status` command (parity with TUI).
- Consider persisting the snapshot history for analytics/telemetry once the upstream API surfaces more than two windows.
