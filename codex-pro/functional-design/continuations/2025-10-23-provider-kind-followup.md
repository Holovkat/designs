# Continuation: Unified Provider Reasoning Handling — Follow-Up Checklist

You’re picking up after aligning codex-core/tui with provider kinds, reasoning controls, and Ollama parsing. Most scaffolding is in place, but there’s still validation and doc polish to land.

## Current Status
- Provider schema now tracks `ProviderKind` + reasoning controls; migrations auto-create/upgrade the default Ollama entry.
- BYOK UI exposes provider kind dropdown, Ollama `think`/post-process toggles, Anthropic thinking budgets, and help copy.
- Requests set provider-specific flags (`think`, Anthropic budgets) and strip `<think>…</think>` blocks via the streaming parser (core tests updated).
- Model picker merges custom providers and snapshot updated; README mentions new provider kinds.
- `cargo test -p codex-agentic-core` and `cargo test -p codex-tui` are green. `cargo test -p codex-core` is red due to `suite::cli_stream::integration_creates_and_checks_session_file` (resume CLI run exits non-zero after the provider changes).
- Workspace format & clippy have been run (`just fmt`, `just fix -p codex-core/-agentic-core/-tui`); snapshot accepted.

## Open Items
1. **Fix the failing codex-core integration test**
   - Repro: `cargo test -p codex-core --test all suite::cli_stream::integration_creates_and_checks_session_file -- --nocapture`.
   - Failure happens on the second `cargo run -p codex-cli … resume --last` invocation (“resume codex-cli run failed”). Likely the new provider defaults or env wiring need to satisfy the resume path.
   - Diagnose by running the command under `RUST_LOG=debug` to see why CLI exits non-zero (missing API key? provider fallback?).
2. **Broader test sweep once the above passes**
   - After fixing the resume test, rerun `cargo test -p codex-core`.
   - Depending on touched crates, confirm `cargo test --all-features` if time permits (per repo policy when common/core touched).
3. **Docs & release notes**
   - `designs/codex-pro/functional-design/09-MODEL-PROVIDERS-AND-SELECTION.md` & `16-CUSTOM-PROVIDERS-BYOK.md` still describe pre-provider-kind UI.
   - Update doc callouts explaining the new dropdown, Ollama help text, Anthropic budgets, and reasoning toggle behavior.
4. **Telemetry sanity check**
   - We now emit stripped reasoning events for Ollama; confirm telemetry (if any) still looks correct.
   - Spot-check by running `cargo test -p codex-core --test all suite::otel::process_sse_emits_tracing_for_output_item -- --nocapture` once resume test green.
5. **Follow-on ideas (optional)**
   - Consider a dedicated integration test covering Anthropic budgets to ensure payloads line up.
   - Evaluate whether `fetch_custom_provider_models` should skip auth for public endpoints (currently requires API key except Ollama).

## Suggested Next Steps
1. Investigate the failing resume CLI test (start with local reproduction).
2. Patch provider defaults or CLI wiring as needed, rerun codex-core tests.
3. Once green, refresh remaining docs and acknowledge telemetry checks.
4. Share validation summary + any remaining concerns (e.g., manual QA, UI screenshots).

Ping if the resume command expects additional env vars post-refactor. Otherwise, once tests/doc updates land you should be ready to close Phase 22.
