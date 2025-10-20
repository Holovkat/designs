# Search-Code Slash Command Plan

## Background
- Existing CLI semantic search lives in `codex-agentic-core/src/index/{commands.rs,query.rs}` and surfaces through the command registry as `search-code`.
- TUI slash commands currently cover `/index` rebuilds only; `chatwidget` dispatches enum-based commands without arguments.
- ACP stdio mode forwards slash-commands through the shared registry (see `codex-agentic-core/src/acp/stdio.rs:1010`).
- Prior fuzzy file search work is documented in `/Users/tonyholovka/workspace/app-macicodex/codex-pro/customisation/functional-design/08-file-search-integration.md`.

## Goals
- Expose semantic index search as a first-class slash command across TUI and ACP.
- Provide a TUI management surface that opens when `/search-code` is entered with no arguments, offering index rebuild, min-confidence tuning, and guided search entry.
- Persist the confidence filter in workspace-local `.codex/settings.json` or the user-level `~/.codex/settings.json`.
- Filter search results to scores ≥ configured threshold (default 60%) before presenting them to users or ACP clients.
- Keep upstream Codex behaviour intact by localising changes to `codex-agentic-*` crates and TUI custom layers.

## Constraints & Considerations
- Follow existing Ratatui styling helpers and selection modal patterns; avoid introducing new widget paradigms unless necessary.
- Preserve backward compatibility for CLI usages of `search-code` (existing automation relies on JSON responses).
- Settings schema extensions must be optional and backwards compatible with older files.
- Composer changes must not regress other slash commands or custom prompt submission flows.

## Proposed Approach

### Data & Persistence
- Extend `codex-agentic-core/src/settings.rs` `Index` struct with `search_confidence_min: Option<f32>`.
- Add helpers `Settings::search_confidence_min()` and `update_index_confidence(min)` to centralise defaults (0.60) and persistence.
- Ensure persistence writes to the resolved settings path (project-local first, then global) and reloads the global cache.

### Core Query Pipeline
- Update `codex-agentic-core/src/index/query.rs` to expose a `filter_hits_by_confidence(hits, min)` helper returning filtered/annotated results.
- Extend `search_command` in `codex-agentic-core/src/index/commands.rs` to honour either a `--min-confidence` flag or the stored default when emitting JSON.
- Register a `search.confidence` command (or extend `search-code`) for programmatic updates used by ACP/TUI.
- Adjust `codex-agentic-core/src/commands/mod.rs` descriptors to describe the new behaviour and expose helper commands to the registry.

### CLI & ACP Integration
- Keep CLI usage intact; document the new `--min-confidence` flag and ensure pretty `render_hits` respects filters.
- In `codex-agentic-core/src/acp/stdio.rs`, keep behaviour minimal: `/search-code <query>` performs the filtered search and returns ranked hits; a bare `/search-code` responds with usage guidance that explicitly calls out semantic (non-regex) matching, suggests good query patterns (function names, doc phrases, quoted multi-word examples), and mentions that confidence can be adjusted via CLI options or by editing `.codex/settings.json`. No modal-style management loop is needed.

### TUI UX
- Introduce a new `SlashCommand::SearchCode` (or equivalent) that accepts optional arguments; refactor `bottom_pane/chat_composer.rs` to emit `InputResult::CommandWithArgs { cmd, args }` so both empty and argumented invocations share the command pathway.
- Update `ChatWidget::dispatch_command` (and call sites) to accept arguments, dispatching:
  - No arguments → trigger `AppEvent::OpenSearchManager`.
  - `<query>` → run filtered search via async task and render results through a dedicated `HistoryCell`.
- Implement `AppEvent` variants for search management (open modal, update confidence, run query).
- Build the modal using `SelectionView` with four actions:
  1. Rebuild index (fire existing `StartIndexBuild`).
  2. Edit min confidence (launch lightweight numeric input view, validate 0–100, persist via core helper).
  3. Prompt for search text (reuse composer or open input modal; results piped through new event).
  4. Exit (dismiss modal).
- Ensure search results cell shows rank, path, line range, and score as a percentage, highlighting filtered-out hits when needed.

### Testing & Validation
- Unit-test new settings helpers.
- Add coverage for composer argument parsing to avoid regressions.
- Extend snapshot tests for TUI modal and search results.
- Run `cargo test -p codex-agentic-core`, `cargo test -p codex-cli`, `cargo test -p codex-tui`, and targeted `cargo insta` review.

## Risks & Mitigations
- **Composer refactor scope**: Introduce incremental tests around `InputResult` to guard against regressions.
- **Settings migrations**: Keep new field optional and defaulted; add docs to warn users about manual edits.
- **Performance**: Filtering is trivial; ensure asynchronous search respects existing cancellation logic.

## References
- `/Users/tonyholovka/workspace/app-macicodex/codex-pro/customisation/functional-design/08-file-search-integration.md`
- `codex-agentic-core/src/index/commands.rs`
- `codex-agentic-core/src/index/query.rs`
- `codex-agentic-core/src/acp/stdio.rs`
- `tui/src/bottom_pane/chat_composer.rs`
- `tui/src/chatwidget.rs`
- `tui/src/app.rs`
