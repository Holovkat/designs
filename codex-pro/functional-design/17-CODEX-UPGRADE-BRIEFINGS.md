## Codex 0.43.0–0.46.0 Change Sequence Briefings

**Purpose**: Provide a chronological map of the upstream releases we need to replay (`rust-v0.43.0` → `rust-v0.46.0`) and highlight where they intersect with our `codex-agentic` customization layer.

### Release Timeline
- **0.43.0** — tagged 2025-10-01 (`a23c1949`).
- **0.44.0** — tagged 2025-10-03 (`488ec061`).
- **0.45.0** — tagged 2025-10-06 (`a7c7869c`).
- **0.46.0** — tagged 2025-10-08 (`b650f912`).

### Custom Footprint To Preserve
`codex-agentic-core/`, `cli/src/agentic_commands.rs`, `cli/src/acp_cmd.rs`, extra CLI binaries, TUI index panes (`tui/src/index_*.rs`), BYOK provider plumbing (`common/src/model_presets.rs`, `core/src/config.rs`), exec/TUI UX overlays, MCP extensions, and documentation under `future-functional-design/`.

For every upstream change below we provide:
1. **Summary** – what upstream delivered.
2. **Collision surface** – fork files likely impacted.
3. **Replay plan** – steps to integrate safely.
4. **Verification** – commands/checks to confirm behaviour.

---

## Codex 0.43.0 (2025-10-01)

### 43.1 Custom prompt pipeline overhaul (#4474, #4476, #4470, #4456)
- **Summary**: Prompt definitions gained named/typed arguments, `/prompts:` namespace enforcement, and front-matter parsing (`3592ecb2`, `bf76258c`, `80ccec65`, `83a4d4d8`).
- **Collision surface**: `common/src/model_presets.rs`, `codex-agentic-core/prompt.rs`, `cli/src/agentic_commands.rs`, TUI composer (`tui/src/bottom_pane/chat_composer.rs` and custom BYOK prompts).
- **Replay plan**:
  - Pull upstream prompt-parsing helpers, then reapply our BYOK/system prompt merge logic.
  - Ensure `/prompts:` routing coexists with our custom slash-command registry.
- **Verification**: `cargo test -p codex-cli`, `cargo test -p codex-tui`, manual `/prompts:list` both for upstream and BYOK prompts.

### 43.2 Exec event and telemetry normalization (#4485, #4482, #4478, #4309)
- **Summary**: Exec renamed “conversation” to “thread”, added `turn.started/completed` events, set `originator`, and adjusted exit codes (`c09e1316`, `ea82f866`, `4a80059b`, `cc1b21e4`).
- **Collision surface**: `exec/src/exec_events.rs`, `exec/src/lib.rs`, `codex-agentic-core/index/`, `core/tests/suite/cli_stream.rs`.
- **Replay plan**:
  - Merge upstream struct/enum renames into our extended event variants.
  - Update index worker assumptions about event names and ensure analytics hooks still fire.
- **Verification**: `cargo test -p codex-exec`, targeted CLI stream tests, manual `codex-agentic run` verifying event log.

### 43.3 MCP streaming & tool-call upgrades (#4481, #4317, #2677)
- **Summary**: Added MCP tool-call items to exec, introduced streamable HTTP MCP servers, and exposed fuzzy file search (`a8edc577`, `3a1be084`, `197f45a3`).
- **Collision surface**: `codex-agentic-core/commands/`, `mcp-server/src/message_processor.rs`, `tui/src/index_worker.rs`.
- **Replay plan**:
  - Adopt upstream streaming adapters while preserving our custom MCP command routing.
  - Reconcile fuzzy search responses with index panes.
- **Verification**: `cargo test -p codex-mcp-server`, manual MCP handshake via `codex-agentic acp`.

### 43.4 Command safety & hardening for Windows shells (#4269, #4521, #4403)
- **Summary**: Implemented PowerShell command vetting, enabled process hardening for release builds, and split hardening utility crate (`dde615f4`, `b8e1fe60`, `43615bec`).
- **Collision surface**: `exec/src/event_processor_with_human_output.rs`, `codex-agentic-core/commands/run.rs`, exec seatbelt wiring.
- **Replay plan**:
  - Merge upstream safety checks, confirm our approval prompts still trigger for agentic commands.
  - Keep additional hardening toggles consistent with BYOK/OSS modes.
- **Verification**: `cargo test -p codex-exec`, manual Windows-equivalent command run (if possible via CI notes).

### 43.5 `/review` workflow & composer UX (#4416, #4240, #4364)
- **Summary**: Added `/review` command, refreshed composer styling, and reintroduced “? for shortcuts” hints (`a9d54b9e`, `43b63cca`, `bcf2bc0a`, `98efd352`, `2719fdd1`).
- **Collision surface**: `cli/src/agentic_commands.rs`, `tui/src/chatwidget.rs`, `tui/src/bottom_pane/`.
- **Replay plan**:
  - Merge upstream slash-command registration; ensure our agentic command registry keeps precedence ordering.
  - Align TUI hints with custom index panes to avoid overlapping keybinds.
- **Verification**: `cargo test -p codex-tui`, manual `/review` invocation in CLI/TUI.

### 43.6 Cloud tasks & telemetry plumbing (#3197, #4417, #4406, #4404)
- **Summary**: Introduced `cloud-tasks` crate, built responses proxy binaries for releases, and adjusted logging channels.
- **Collision surface**: `cloud-tasks/`, `exec/src/event_processor_with_jsonl_output.rs`, packaging scripts.
- **Replay plan**:
  - Decide whether agentic fork ships cloud tasks; if not, stub integration while keeping build scripts compatible.
  - Ensure any new binaries are excluded or adapted in our release pipeline.
- **Verification**: `cargo build --all`, smoke `codex-agentic -- help` to confirm packaging unaffected.

### 43.7 Legacy JSON exec output removed (#4525, #4529)
- **Summary**: Dropped `codex exec --json` legacy format and enforced request/response symmetry macros (`7fc3edf8`, `32853ecb`).
- **Collision surface**: `exec/src/event_processor_with_jsonl_output.rs`, `codex-agentic-core/index_worker.rs`, CLI docs.
- **Replay plan**:
  - Remove any fork-only code relying on deprecated format.
  - Update documentation to reflect JSONL-only export.
- **Verification**: `cargo test -p codex-exec`; confirm JSON logs still flow into index.

---

## Codex 0.44.0 (2025-10-03)

### 44.1 Model switcher redesign (#4178, #4641)
- **Summary**: TUI picker became two-stage, elevating `gpt-5-codex` to the top (`06e34d46`, `231c36f8`).
- **Collision surface**: `tui/src/app.rs`, `tui/src/chatwidget.rs`, custom BYOK selector overlays.
- **Replay plan**:
  - Merge upstream state machine for the picker, then layer BYOK provider metadata.
  - Ensure index panes still link to the selector shortcuts.
- **Verification**: `cargo test -p codex-tui`, manual model switching covering OSS/BYOK.

### 44.2 Session mode split & settings persistence (#4612, #4579)
- **Summary**: Interactive vs. non-interactive sessions split, with settings persisted per thread (`4c566d48`, `c07fb711`).
- **Collision surface**: `codex-agentic-core/settings.rs`, `exec/src/lib.rs`, `tui/src/lib.rs`.
- **Replay plan**:
  - Align our agentic session metadata with upstream defaults.
  - Reconcile settings storage so custom provider overrides stay scoped per thread.
- **Verification**: `cargo test -p codex-agentic-core`, manual resume of threads checking settings persistence.

### 44.3 Exec shell ergonomics (#4633, #4615, #4573)
- **Summary**: `codex exec` respected terminal color support, accepted `CODEX_API_KEY`, and refreshed approval UI (`1d94b911`, `2f6fb37d`, `07c1db35`).
- **Collision surface**: `exec/src/event_processor_with_human_output.rs`, `cli/src/main.rs`, approval prompts.
- **Replay plan**:
  - Integrate env var/auth changes while keeping BYOK login flow intact.
  - Merge UI adjustments alongside our custom streaming prompts.
- **Verification**: `cargo test -p codex-exec`, manual `codex-agentic exec` with/without API key.

### 44.4 TUI telemetry & dialogs (#4622, #4627, #4629)
- **Summary**: Dialog spacing tweaks, fixed false “task complete” indicator, and dimmed context usage display (`25a2e15e`, `c0a84473`, `9617b69c`).
- **Collision surface**: `tui/src/status/*.rs`, `tui/src/app_event.rs`, custom index panes.
- **Replay plan**:
  - Merge visual tweaks while ensuring our added widgets keep consistent styling helpers.
- **Verification**: `cargo test -p codex-tui`, snapshot review for status widgets.

### 44.5 Instruction fallback & docs (#4544, #4583)
- **Summary**: CLI fell back to configured instruction files when `AGENTS.md` missing and added dedicated exec docs (`400a5a90`, `b93cc0f4`).
- **Collision surface**: `codex-agentic-core/prompt.rs`, documentation overlays in `future-functional-design`.
- **Replay plan**:
  - Merge fallback logic and adjust our BYOK prompt discovery to respect the new ordering.
  - Cross-link new docs with agentic quick-starts.
- **Verification**: `cargo test -p codex-agentic-core`, manual `codex-agentic run --agents-file` checks.

### 44.6 Pipeline diagnostics (#4630, #4572, #4584)
- **Summary**: Added request IDs to errors, normalized key hints, and corrected status usage ratios (`138be0fd`, `e899ae7d`, `b07aafa5`).
- **Collision surface**: `core/src/client.rs`, `tui/src/status/rate_limits.rs`, logging hooks.
- **Replay plan**:
  - Integrate request ID plumbing into our BYOK logging pipeline.
  - Update rate-limit widgets with new ratio computation.
- **Verification**: `cargo test -p codex-core`, `cargo test -p codex-tui`.

---

## Codex 0.45.0 (2025-10-06)

### 45.1 Managed configuration introduction (#3868)
- **Summary**: Core gained managed config loading to orchestrate environment-specific defaults (`a5b7675e`).
- **Collision surface**: `core/src/config.rs`, `codex-agentic-core/settings.rs`, BYOK presets.
- **Replay plan**:
  - Merge config loaders, then reapply our custom provider layering and settings overrides.
  - Document any new keys required by managed config in agentic docs.
- **Verification**: `cargo test -p codex-core`, `cargo test -p codex-agentic-core`.

### 45.2 Structured output support (#4793, #4675, #4740)
- **Summary**: Added structured-output handling, surfaced context window errors, and appended truncation hints (`90fe5e4a`, `90ef94d3`, `cc2f4aaf`).
- **Collision surface**: `exec/src/event_processor_with_jsonl_output.rs`, TUI transcript overlays, agentic plan interpreter.
- **Replay plan**:
  - Ensure structured-output paths integrate with our plan rendering and index ingest.
  - Teach BYOK provider resolver which models support the feature.
- **Verification**: `cargo test -p codex-exec`, manual run with structured output template.

### 45.3 Parallel tool calls & helpers (#4663, #4829, #4753, #4758)
- **Summary**: Enabled parallel tool calls, simplified parallel execution, and introduced SSE test helpers (`dc3c6bf6`, `f2555422`, `06853d94`, `aecbe0f3`).
- **Collision surface**: `codex-agentic-core/commands/`, `exec/src/lib.rs`, integration tests under `core/tests/suite`.
- **Replay plan**:
  - Merge concurrency primitives while ensuring our tool registry preserves ordering guarantees.
  - Update tests to use upstream helpers alongside agentic fixtures.
- **Verification**: `cargo test -p codex-agentic-core`, `cargo test -p codex-exec`, CLI stream suite.

### 45.4 Sandbox command & Windows onboarding (#4782, #4697, #4795)
- **Summary**: Added `codex sandbox {linux|macos}`, introduced Windows WSL onboarding copy, and tweaked clipboard messaging (`77a8b7fd`, `6c2969d2`, `c264ae60`).
- **Collision surface**: `cli/src/main.rs`, `cli/src/bin/`, onboarding docs in `future-functional-design`.
- **Replay plan**:
  - Integrate new subcommand while keeping our agentic CLI aliases.
  - Update docs to clarify sandbox expectations with our custom seatbelt usage.
- **Verification**: `cargo test -p codex-cli`, manual `codex-agentic sandbox --help`.

### 45.5 apply_patch behaviour adjustments (#4718, #4742, #4739)
- **Summary**: Enabled freeform `apply_patch`, instructed models to prefer it, and removed redundant `read-file` helpers (`4764fc1e`, `0ad1b078`, `f3b4a26f`).
- **Collision surface**: `codex-agentic-core/prompt.rs`, plan templates, documentation.
- **Replay plan**:
  - Sync prompt guidance and ensure our agent pipeline still guards destructive commands.
- **Verification**: `cargo test -p codex-agentic-core`, manual `/plan` scenario covering apply_patch.

### 45.6 MCP authentication upgrades (#4517, #4774, #4689)
- **Summary**: Added MCP OAuth credential handling, upgraded RMCP client, and relaxed requirements for no-auth HTTP servers (`1d17ca1f`, `7fa5e95c`, `d13ee79c`).
- **Collision surface**: `mcp-server/src/message_processor.rs`, `codex-agentic-core/commands/`, settings schema.
- **Replay plan**:
  - Merge auth helpers, then restore our BYOK credential storage semantics.
- **Verification**: `cargo test -p codex-mcp-server`, manual MCP login flow.

### 45.7 Misc CLI/test hygiene (#4784, #4756, #4740)
- **Summary**: Tightened assertions, adopted `assert_matches!`, and refined doc workflows (`b2d81a7c`, `5c42419b`, `3495a7dc`).
- **Collision surface**: Test suites we customize (`core/tests/suite`, `exec/tests`).
- **Replay plan**:
  - Merge upstream expectations while keeping agentic fixtures green.
- **Verification**: Regression sweep across touched crates.

---

## Codex 0.46.0 (2025-10-08)

### 46.1 Chat naming & aliasing (#4974, #4971)
- **Summary**: Added chat naming UX and alias creation (`ec238a2c`, `b6165aee`, revert guard `43002366`).
- **Collision surface**: `tui/src/chatwidget.rs`, `tui/src/app.rs`, CLI session summaries.
- **Replay plan**:
  - Merge naming state while ensuring our index panes and BYOK prompts reflect the chosen alias.
- **Verification**: `cargo test -p codex-tui`, manual chat rename in TUI/CLI.

### 46.2 CLI navigation fixes (#4944, #4896)
- **Summary**: Fixed CLI `UP/ENTER` handling and removed `/review` instruction hack (`876d4f45`, `b016a3e7`).
- **Collision surface**: `cli/src/main.rs`, agentic command registry.
- **Replay plan**:
  - Integrate keybinding fix while preserving agentic command overrides.
- **Verification**: `cargo test -p codex-cli`, manual history navigation test.

### 46.3 New built-in tools & stream tweaks (#4820, #4817, #4829, #4953)
- **Summary**: Added `grep_files` and `list_dir` tools, simplified parallel processing, and adjusted SSE logging (`f52320be`, `226215f3`, `f2555422`, `fe8122e5`).
- **Collision surface**: `codex-agentic-core/commands/`, tool registry, exec tests.
- **Replay plan**:
  - Merge tool implementations, adding agentic defaults (e.g., BYOK restrictions).
  - Update tests to cover new tools within our planner.
- **Verification**: `cargo test -p codex-agentic-core`, `cargo test -p codex-exec`.

### 46.4 TUI rendering refresh (#4957, #4853, #4848, #4674, #4967)
- **Summary**: Hardcoded xterm palette, added breathing spinner for true-color terminals, tightened transcript layout, fixed palette offset, and wrapping bugs (`e896db11`, `a0d56541`, `0e5d72cc`, `4b0f5eb6`, `f4bc03d7`).
- **Collision surface**: `tui/src/app.rs`, `tui/src/chatwidget.rs`, status widgets, palette helpers.
- **Replay plan**:
  - Merge visual updates, then reapply agentic-specific highlights (index badges, rate-limit colouring) using Stylize helpers.
- **Verification**: `cargo test -p codex-tui`, snapshot review (`cargo insta show`), manual TUI launch.

### 46.5 MCP configuration & auth surface (#4918, #4917, #4904, #4857, #4846)
- **Summary**: Added MCP auth status reporting, enabled toggling via `enabled` flag, expanded streamable HTTP support, and introduced credential store selection with bearer token fixes (`3c5e12e2`, `d3820f47`, `a43ae86b`, `496cb801`, `d73055c5`).
- **Collision surface**: `mcp-server/src/message_processor.rs`, `codex-agentic-core/commands/`, settings schema.
- **Replay plan**:
  - Merge config structs and ensure our custom MCP command wiring exposes the new toggles.
  - Reconcile credential handling with existing BYOK secrets.
- **Verification**: `cargo test -p codex-mcp-server`, manual `codex-agentic mcp add` with credentials store.

### 46.6 Exec/TUI compact mode refinements (#4942, #4911, #4854, #4894)
- **Summary**: Added compact truncation for transcripts, fixed tab char rendering, removed bottom padding, and ensured SDK originator is set (`687a13bb`, `96acb8a7`, `12fd2b41`, `60f9e85c`).
- **Collision surface**: `tui/src/chatwidget.rs`, `tui/src/app.rs`, `codex-agentic-core/prompt.rs`.
- **Replay plan**:
  - Merge truncation logic into our transcript pipeline and confirm BYOK plan exports respect it.
- **Verification**: `cargo test -p codex-tui`, manual transcript with compact mode enabled.

### 46.7 Credential-less tooling polish (#4856, #4894, #4692, #4695)
- **Summary**: Switched token count events to `Number`, fixed zsh completions, and added resume note output (`b09f62a1`, `60f9e85c`, `b16c985e`, `5833508a`).
- **Collision surface**: `core/src/openai_model_info.rs`, CLI completions, resume command.
- **Replay plan**:
  - Merge data type updates and ensure completions still include agentic subcommands.
- **Verification**: `cargo test -p codex-core`, manual `codex-agentic resume`.

---

**Next Releases**: When upstream ships 0.47.0+, append new sections in chronological order and cross-link the checklist (`00-IMPLEMENTATION-CHECKLIST.md`) so replay tasks remain synchronized.
