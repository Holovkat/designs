## Codex 0.47.0 Alignment – Continuation Brief

**Revision timestamp:** 2025-10-22
**Current branch:** `codex-47-alignment`

### Completed so far
- Rebased the CLI, exec, MCP, and core config layers to upstream `rust-v0.47.0`, preserving the fork's agentic surface (custom settings, commands, model management).
- Ported the new feature flag system (`codex-core`), custom provider handling, rate-limit reporting, and MCP resource tooling. `cargo check -p codex-cli` now succeeds after all core crates compile against updated APIs.
- Updated dependency crates (`protocol`, `rmcp-client`, `mcp-client`, `cloud-tasks`) to upstream revisions and reconciled API changes, including OAuth/auth snapshots and rate-limit telemetry.

### Outstanding work
1. **TUI alignment**
   - Merge upstream feedback overlay, update prompt workflow, and search/index UI deltas into the agentic TUI. Many files under `codex-rs/tui/` still differ from upstream (see git status).
   - Refresh or accept the associated snapshot updates once the intended UI output is verified (`cargo test -p codex-tui`, `cargo insta pending-snapshots`, etc.).
2. **MCP & feedback wiring**
   - Ensure the new `codex-feedback` crate is integrated (hooked from TUI/app server) and confirm logging/rotation paths are correct under the fork’s settings.
   - Double-check MCP resource handler behavior with the updated RMCP client (list/read/templates) once TUI consumes the new fields.
3. **Formatting & lint/tests** (per instructions)
   - After finishing Rust changes: `just fmt` in `codex-rs`, followed by `just fix -p <crate>` per touched crates (likely `codex-cli`, `codex-core`, `codex-tui`, `codex-exec`, `codex-mcp-server`, etc.).
   - Run targeted test suites: e.g., `cargo test -p codex-cli`, `cargo test -p codex-core`, `cargo test -p codex-tui`, and full `cargo test --all-features` if core/common/protocol change scope requires it. Handle snapshot updates intentionally.

### Notes & reminders
- Preserve fork-specific behavior when resolving conflicts (agentic settings, default prompts, index tooling). Do not regress the custom commands or BYOK flows introduced in `codex-agentic-core`.
- Maintain adherence to repository instructions: run formatting/lints/tests, inline format args, prefer Stylize helpers in TUI, etc.
- Record any intentional divergences from upstream in design docs once resolved.

Use this brief as the starting point for the next session to continue the alignment work, focusing first on the `codex-rs/tui/` changes.
