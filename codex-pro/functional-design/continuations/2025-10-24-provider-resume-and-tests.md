# Continuation: Provider Resume Flow & Test Parity

Picking up after Phase 22, Ollama/BYOK now behave correctly for live turns, reasoning, and manual cache refreshes. One outstanding integration test (`suite::cli_stream::integration_creates_and_checks_session_file`) still fails, and CLI parity for the new model-refresh flow remains unimplemented. Tackle these next to unblock a full codex-core test pass and improve UX for non-TUI workflows.

## Current Status
- Provider schema migrations, BYOK UI, manual model refresh, and reasoning formatting are complete. Docs (`09`, `16`, `22`, quick-start, architecture) have been updated.
- `cargo test -p codex-agentic-core` and `cargo test -p codex-tui` are green.
- `cargo test -p codex-core --test all suite::cli_stream::integration_creates_and_checks_session_file -- --nocapture` still fails: the second `cargo run -p codex-cli … resume --last` returns non-zero (likely due to missing cached models or provider/tool gating when resuming). Needs triage.
- Ollama tool calls are disabled via provider-kind gating. CLI `models list` reflects cached results but there’s no CLI command to refresh BYOK models yet.

## Next Steps
1. **Fix the `integration_creates_and_checks_session_file` failure**
   - Reproduce locally via `cargo test -p codex-core --test all suite::cli_stream::integration_creates_and_checks_session_file -- --nocapture`.
   - Capture the failing resume command’s output (`RUST_LOG=debug`) to determine why the CLI exits non-zero (e.g., missing provider config, retry exhaustion, cached model mismatch).
   - Patch the resume path so it loads the persisted provider/model pairing correctly (likely by ensuring BYOK caches exist or gracefully handling missing models). Re-run the targeted test, then the full suite.
   - Update the checklist once green.

2. **Add CLI support for BYOK model refresh**
   - Expose a `codex-agentic models refresh <provider-id>` subcommand that reuses the existing async helper (`fetch_custom_provider_models`), matching the TUI’s “Refresh models” action.
   - Update docs (`09`, `16`) to mention the CLI workflow; add integration tests if feasible.

3. **Nice-to-have cleanups**
   - Consider catching and logging reasoning headers during CLI resume so TUI and headless flows stay consistent.
   - Re-run manual smoke tests (OpenAI/Ollama/Anthropic) after fixing the resume test to ensure no regressions.

Ping the team if new failures crop up or if you need additional sample BYOK configs before diving in.
