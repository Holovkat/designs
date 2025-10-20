# Codex 0.43.0 → 0.46.0 Uplift (Addendum)

_Date: 2025-10-18_

## Highlights
- Merged upstream releases `rust-v0.43.0` → `rust-v0.46.0`, reconciling prompt pipeline, session defaults, parallel tool calls, palette updates, and MCP credential enhancements with the agentic fork.
- Preserved BYOK API keys on provider rename and ensured review mode reuses the active custom provider model, preventing BYOK `/review` failures.
- Completed targeted lints/tests (`just fix -p ...`, `cargo test -p codex-*`) and a full workspace run `cargo test --all-features`.

## Manual Verification Summary
- CLI smoke (`codex-agentic --help`, `codex-agentic run --version`, `/review` dry run) against mocked BYOK provider.
- TUI behaviour validated via refreshed snapshots/headless tests; full visual pass pending interactive session.
- MCP handshake exercised via mock server, confirming new auth status and credential store wiring.

## Files of Interest
- `core/src/codex.rs`: review-mode model selection now respects custom providers.
- `tui/src/app.rs`: BYOK rename path retains API keys.
- `app-server/tests/suite/user_agent.rs`, `mcp-server/tests/common/mcp_process.rs`: tests updated to expect workspace version `0.46.0` in user agents.
- Documentation updates: `future-functional-design/03-SETTINGS-AND-CONFIG.md`, `future-functional-design/16-CUSTOM-PROVIDERS-BYOK.md`.

## Outstanding Follow-ups
- Interactive TUI validation (visual) and live MCP server check when credentials are available.
- Update remaining design docs where necessary as additional behaviours are observed.
- Prepare release packaging once user approval is granted.
