# codex-pro: Customisations Overview

This document lists all downstream customisations we’ve added on top of upstream `openai/codex` and how they’re wired in this repository. It covers the launcher CLI, TUI, and ACP, and ends with a migration plan (porting these customisations into another Rust CLI) and a plugin‑first redesign that avoids clap.

## Layout (What’s Upstream vs Downstream)
- Upstream (submodule): `codex-core/` → `openai/codex` (all Rust crates under `codex-rs/*`).
- Downstream (this repo):
  - CLI launcher: `macicodex/codex-agentic/` (binary: `codex-agentic`).
  - TUI library (downstream wrapper of upstream TUI): `macicodex/codex-tui/` (crate name `macicodex-tui`).
  - ACP adapter: `macicodex/codex-acp/`.
  - Index engine (downstream, embedded in the launcher): `macicodex/codex-agentic/src/indexing/`.
  - Installer + lockstep launcher scripts: `scripts/install.sh`, `scripts/codex-agentic.sh`.
  - CI/Release workflows (tuned for this repo): `.github/workflows/*`.

---

## CLI (codex-agentic)
- Combined launcher that prefers the embedded upstream CLI/TUI but adds downstream features and ACP.
- Binary: `codex-agentic`.
- Key file: `macicodex/codex-agentic/src/main.rs:1`.

### Downstream Features
- Upgrade banner targeting this repo
  - Sets env vars so the TUI checks this repo’s releases by default:
    - `CODEX_CURRENT_VERSION`, `CODEX_AGENTIC_UPDATE_REPO`, `CODEX_UPDATE_LATEST_URL`, `CODEX_UPGRADE_URL`, `CODEX_AGENTIC_UPGRADE_CMD`, `CODEX_DISABLE_UPDATE_CHECK`.
  - Where: `macicodex/codex-agentic/src/main.rs:423` (and nearby assignments in `run_embedded_cli`).

- Local code index (search + status + build)
  - Subcommands wired in CLI and implemented in `indexing/` module.
  - Location: `macicodex/codex-agentic/src/indexing/mod.rs:1` (engine), and CLI dispatch in `macicodex/codex-agentic/src/main.rs:163, 360, 382`.
  - Stores data under `.codex/index/` (manifest, vectors, analytics).
  - Engine: `fastembed` for text embeddings + `hnsw_rs` for ANN search.

- Exec quality-of-life
  - Quiet `exec` that forwards to upstream but only prints the final answer; optional `--all` restores full upstream output (`macicodex/codex-agentic/src/main.rs:174–214`).
  - `apply` wrapper that calls upstream apply via library (no shelling out).

- ACP entrypoint
  - `codex-agentic acp` runs the ACP stdio agent (`macicodex/codex-agentic/src/main.rs:318`), bridging this runtime to ACP clients.

- Model helpers
  - `models list --oss` lists Ollama models using upstream config load + downstream helper (`macicodex/codex-agentic/src/main.rs:392–418`).

- TUI integration hooks
  - Registers an index build handler so the TUI can show a live overlay/progress (`macicodex/codex-agentic/src/main.rs:459–512`).

### Scripts
- Installer (download from GitHub Releases): `scripts/install.sh:1`.
- Lockstep launcher (sync newest local build → `~/.cargo/bin`): `scripts/codex-agentic.sh:1`.

### Customised Commands (User‑Facing)
- `acp` — run ACP over stdio for editors
  - Variant: `macicodex/codex-agentic/src/main.rs:43`
  - Flags (examples): `--model`, `--oss`, `--yolo-with-search`, `-c key=value` for config overrides.

- `exec` — quiet single‑shot by default; `--all` restores full upstream verbosity
  - Variant: `macicodex/codex-agentic/src/main.rs:115`
  - Quiet path returns only the final message; uses an internal `__exec_internal` to capture output.

- `apply` — apply latest diff via library call (no external process)
  - Variant: `macicodex/codex-agentic/src/main.rs:101`

- `models list --oss` — list local (Ollama) models through upstream config
  - Models enum: `macicodex/codex-agentic/src/main.rs:91`
  - Helper: `macicodex/codex-agentic/src/main.rs:389`

- `index` — local semantic index management (downstream engine)
  - Enum: `macicodex/codex-agentic/src/main.rs:138`
  - Subcommands: `build`, `query`, `status`, `verify`, `clean`, `ignore`.
  - Args (build/query/ignore): `macicodex/codex-agentic/src/main.rs:170`, `:232`, `:216`.

- `search-code` (alias: `search`) — convenience wrapper for `index query`
  - Variant: `macicodex/codex-agentic/src/main.rs:146`

- `resume` — resume a previous session (`--last`, by id, or picker) and forward chat flags
  - Variant: `macicodex/codex-agentic/src/main.rs:135`

- `help-recipes` — print common usage recipes
  - Variant: `macicodex/codex-agentic/src/main.rs:128`

- `cli` — run embedded upstream CLI directly (for full compatibility)
  - Variant: `macicodex/codex-agentic/src/main.rs:85`

Other launch behaviors
- Forward‑args passthrough when no subcommand is used: `macicodex/codex-agentic/src/main.rs:18` (CliArgs).
- Legacy hidden flags kept for continuity: `--acp`, `--list-models` (`macicodex/codex-agentic/src/main.rs:22`, `:26`).

---

## TUI (macicodex-tui)
Downstream wrapper library around upstream TUI with hooks and banners tailored to this repo.

### Downstream Features
- Upgrade banner + repo routing
  - Reads env vars from the launcher to fetch the latest version from this repo’s releases (`macicodex/codex-tui/src/updates.rs:62–71`, `:78–101`).
  - Version comparison supports `-apc.N` suffix (`macicodex/codex-tui/src/updates.rs:111–121, 122–129`).

- Index build overlay (live progress)
  - Bridge for the launcher to provide an index build handler: `macicodex/codex-tui/src/indexing_bridge.rs:12` and `macicodex/codex-tui/src/lib.rs:76`.
  - App event handling for `IndexingStarted/Progress/Completed/Error`: `macicodex/codex-tui/src/app.rs:367, 397, 426, 454`.
  - Footer hints for last index status/updated: `macicodex/codex-tui/src/bottom_pane/chat_composer.rs:128–201`.

- About‑codebase quick view + background refresh
  - Scans repo and renders saved report; refreshes opportunistically (`macicodex/codex-tui/src/review_codebase.rs:79–200, 203–237`).
  - Provenance snapshotting (git state, file sampling) to build prompts (`macicodex/codex-tui/src/review_codebase.rs:33–75, 239–260`).

### Timers & Secondary Status Bar (Indexed • Checked)
- What shows where
  - Two-line footer in the composer area. Row 1: generic key hints. Row 2 (cyan): index info and transient notices.
  - Data fields: `index_status` (transient, e.g., progress/notice) and `index_last_updated` (persistent “Indexed • Checked”).
    - Fields: `macicodex/codex-tui/src/bottom_pane/chat_composer.rs:81–82`.
    - Setters: `macicodex/codex-tui/src/bottom_pane/chat_composer.rs:191–197`.
  - Layout chooses 1 vs 2 rows when either field is present and renders the second row in cyan:
    - Layout/height: `macicodex/codex-tui/src/bottom_pane/chat_composer.rs:1276–1310`.
    - Render: `macicodex/codex-tui/src/bottom_pane/chat_composer.rs:1379–1390`.

- Persistent “Indexed • Checked” line
  - Computed from `.codex/index/manifest.json` (`last_refresh` or `created_at`) and `.codex/index/analytics.json` (`last_attempt_ts`).
  - Relative age string builder: `compute_relative_age(...)` in `macicodex/codex-tui/src/chatwidget.rs:2180–2193`.
  - Refresh logic reads the files and sets `index_last_updated` accordingly:
    - `macicodex/codex-tui/src/chatwidget.rs:2195–2299` (manifest + analytics path resolution and rendering).
  - When it refreshes:
    - On session start: `macicodex/codex-tui/src/chatwidget.rs:72–76` (called from `on_session_configured`).
    - On index build completion: `macicodex/codex-tui/src/app.rs:101–103` via `refresh_index_footer_now()`.
    - On demand: `macicodex/codex-tui/src/chatwidget.rs:35–41` (`refresh_index_footer_now`).

- Index build notifications (compact progress + overlay)
  - Events consumed by TUI: `AppEvent::IndexingStarted/Progress/Completed/Error`.
    - Start: initialize compact footer status with a bar and counts (`macicodex/codex-tui/src/app.rs:35–46`).
    - Progress: update footer every tick (`macicodex/codex-tui/src/app.rs:64–75`).
    - Completed: clear footer, show 10s notice, refresh persistent line (`macicodex/codex-tui/src/app.rs:92–103`).
    - Error: clear footer and show error (`macicodex/codex-tui/src/app.rs:105–111`).
  - Optional full-screen overlay (in addition to the compact footer): gated by `CODEX_INDEX_OVERLAY` env (`macicodex/codex-tui/src/app.rs:18–34, 48–63, 77–91`).

- Timers / auto-refresh
  - Transient footer notice TTL: 10s on successful build (`macicodex/codex-tui/src/app.rs:94–101`).
  - Background “post-turn” refresh: after each turn, if `analytics.json:last_attempt_ts` is older than `CODEX_INDEX_REFRESH_MIN_SECS` (default 300s), trigger a background index build and seed the compact footer line immediately.
    - Logic: `macicodex/codex-tui/src/chatwidget.rs:101–121, 2300–2400`.
    - Disable with `CODEX_DISABLE_POST_TURN_INDEX_REFRESH=1`.
    - Threshold override: `CODEX_INDEX_REFRESH_MIN_SECS` (seconds).
  - Footer notice plumbing: `set_footer_notice()` sets `index_status` and schedules `ClearFooterNotice` via `tokio::time::sleep()` (`macicodex/codex-tui/src/chatwidget.rs:22–33`).

---

## ACP (macicodex/codex-acp)
Adapter that presents this runtime over ACP stdio for editors and external clients.

### Downstream Features
- Stdio entrypoints
  - `run_stdio_blocking()` loads upstream config then runs ACP (`macicodex/codex-acp/src/lib.rs:82–95`).
  - `run_stdio_with_config()` for embedders (`macicodex/codex-acp/src/lib.rs:13–31`).

- Status/intro + slash commands
  - Prints a short intro banner with version and `/status` (`macicodex/codex-acp/src/agent.rs:261–292, 474–485, 553`).
  - Slash commands include `/status`, `/approvals`, `/index ...` (`macicodex/codex-acp/src/agent/commands.rs:43–67, 372–426`).

- Approvals + sandbox policies
  - Tracks current approval policy and sandbox mode; supports “yolo with search” convenience (`macicodex/codex-acp/src/agent.rs:46–47, 357–358`).

- Event mapping to ACP
  - Translates MCP tool calls and exec events into ACP ToolCall/ToolCallUpdate messages (`macicodex/codex-acp/src/agent.rs:707–825, 859–953`).

- Review persistence helpers
  - Minimal persistence for code review display (`macicodex/codex-acp/src/review_persist.rs:1`).

---

## Index Engine (Downstream)
- Location: `macicodex/codex-agentic/src/indexing/`.
- Embedding model: `fastembed` (`bge` family by default).
- ANN: `hnsw_rs` storing flat vectors plus HNSW graph; on‑disk under `.codex/index/`.
- Progress events emitted for both CLI text and TUI overlay modes.
- Commands exposed via CLI: `index build|status|verify|clean|query`, plus `search-code` convenience.

---

## CI/Release Customisations
- Workflows tuned for GH runners instability (macos-13 removed, `--locked` dropped, git fetch via CLI): `.github/workflows/ci.yml`, `.github/workflows/release.yml`.
- Release artifact naming: `codex-agentic-vX.Y.Z-<os>-<arch>.tar.gz` plus `SHA256SUMS.txt`.
- Version bump scheme for local testing: `X.Y.Z-apc.N` (root `Cargo.toml [workspace.package]`).

---

## Migrating These Customisations to Another Rust CLI
Goal: reuse our downstream parts (indexing, ACP, upgrade checks, TUI overlays) inside a different Rust CLI.

### What to Carve Out (crate‑by‑crate)
1) `indexing` → extract to a library crate
- Move `macicodex/codex-agentic/src/indexing/` into `crates/codex-index/`.
- Public API surface:
  - `build(args, sink)`, `status()`, `verify()`, `clean()`, `query(args)`, progress events enum.
  - No CLI parsing inside; just structs and functions.

2) `updates` (upgrade check) → small library crate
- Move `macicodex/codex-tui/src/updates.rs` logic into `crates/codex-updates/` with env‑driven config.
- API: `fn latest(config) -> Option<String>` + `fn spawn_refresh(config)`.

3) `acp-adapter`
- Keep `macicodex/codex-acp/` mostly intact but expose a thin trait boundary for “agent host” callbacks.
- API: `run_stdio[_with_config]` + `trait AgentHost` for approvals, sandbox, tool mapping (so another CLI can provide policies without forking code).

4) `tui-bridge`
- Keep overlays and events generic (crate `crates/codex-tui-bridge/`) so any host TUI can adopt the overlay without linking the whole launcher.

5) `launcher` (binary)
- New host CLI links these crates and wires minimal arg parsing + env plumbing.

### Porting Steps
- Vendor the four crates above or add them as git deps.
- Replace direct file paths with host‑provided `cwd` and config.
- Wire a small “index build handler” into your TUI (or print to stdout if headless).
- Use the updates crate to show a banner or just print one‑liners.
- Expose ACP via a `--acp` or separate `my-cli-acp` binary calling `run_stdio_blocking()`.

---

## Rebuilding Cleanly: Plugin‑First, No clap
If we rebuilt from scratch, the host would be tiny and every custom bit would be a plugin or service behind a trait. Keep args simple and discoverable, avoid clap.

### Host Crates
- `app-host`: Defines traits and the event bus.
  - `trait IndexProvider { fn build(&self, cfg, sink); fn query(&self, q) -> Results; /* … */ }`
  - `trait UpdateChecker { fn current(&self) -> String; fn latest(&self) -> Option<String>; }`
  - `trait AcpTransport { fn run_stdio(&self, cfg) -> Result<()>; }`
  - `trait UiOverlay { fn register(&self, bus: &mut EventBus); }`
- `app-cli`: Thin binary, manual args (see below), calls into host traits.
- `app-tui`: UI shell that consumes an `EventBus` and registers overlays from plugins.

### Plugin Loading Options
- Static registry (compile‑time): use `inventory` or `linkme` to register plugins; simple and robust.
- Process plugins (runtime): launch `my-plugin` sub‑binaries that speak JSON‑RPC over stdio; great isolation and language‑agnostic.
- Wasm plugins (runtime): wasmtime; maximum isolation, moderate complexity.

### Simple Argument Parsing (no clap)
Use `lexopt` or `pico-args` for a tiny, explicit parser. Example with `lexopt`:

```rust
use lexopt::prelude::*;

enum Cmd { Acp, IndexBuild, IndexQuery { q: String }, Exec { quiet: bool }, }

fn parse(mut p: lexopt::Parser) -> anyhow::Result<Cmd> {
    match p.next()? { Some(Arg::Value(v)) if v == "acp" => Ok(Cmd::Acp),
        Some(Arg::Value(v)) if v == "index" => match p.next()? {
            Some(Arg::Value(v)) if v == "build" => Ok(Cmd::IndexBuild),
            Some(Arg::Value(v)) if v == "query" => {
                let q = p.value()?.string()?; Ok(Cmd::IndexQuery { q })
            }
            _ => anyhow::bail!("usage: index build|query <q>"),
        },
        Some(Arg::Value(v)) if v == "exec" => {
            let mut quiet = false; while let Some(arg) = p.next()? {
                match arg { Arg::Short('q') => quiet = true, _ => break }
            }
            Ok(Cmd::Exec { quiet })
        }
        _ => anyhow::bail!("usage: acp|index|exec"),
    }
}
```

This keeps parsing obvious and maintainable, avoids macro magic, and plays well with plugin‑defined subcommands (plugins can advertise commands via a simple struct and the host can delegate once it sees an unrecognized verb).

### Event Bus + Overlays
- Define `enum AppEvent { IndexingStarted{total}, IndexingProgress{…}, IndexingCompleted, IndexingError{msg}, … }` in `app-host`.
- TUI consumes events; plugins post events through `Sender<AppEvent>`.
- The index plugin emits progress just like today; the TUI overlay subscribes without knowing who implements indexing.

### Config
- One TOML file with sections per plugin: `[index]`, `[updates]`, `[acp]`.
- Environment overrides are namespaced: `APP_INDEX_*`, `APP_UPDATES_*`.
- Host merges config and passes the relevant subset to each plugin.

### Migration Notes (from current tree)
- Move `indexing/` into `IndexProvider` plugin with the same progress events.
- Wrap `macicodex-tui` overlays behind `UiOverlay` trait.
- Wrap `codex-acp` entrypoints behind `AcpTransport` trait.
- Lift the upgrade checker into `UpdateChecker` plugin.
- Replace clap in `codex-agentic` with a `lexopt` parser (keep verbs identical).

---

## Quick Provenance Pointers
- CLI env wiring: `macicodex/codex-agentic/src/main.rs:423–456`.
- CLI exec/apply/models/resume: `macicodex/codex-agentic/src/main.rs:140–214, 318–418`.
- Index engine: `macicodex/codex-agentic/src/indexing/mod.rs:1`.
- TUI upgrade check: `macicodex/codex-tui/src/updates.rs:62–101, 111–129`.
- TUI index overlay: `macicodex/codex-tui/src/indexing_bridge.rs:12`, `macicodex/codex-tui/src/app.rs:367,397,426,454`.
- TUI about‑codebase: `macicodex/codex-tui/src/review_codebase.rs:79–200, 203–237`.
- ACP entrypoints + commands: `macicodex/codex-acp/src/lib.rs:13–31, 82–95`, `macicodex/codex-acp/src/agent/commands.rs:43–67, 372–426`.
- Installer + lockstep: `scripts/install.sh:1`, `scripts/codex-agentic.sh:1`.

---

## Summary
- We added a downstream launcher (CLI), a wrapped TUI with upgrade and index overlays, an ACP adapter, and a local semantic indexer. Scripts and CI glue keep installation and releases smooth.
- To migrate, carve these into four crates: `index`, `updates`, `acp-adapter`, `tui-bridge`. Link them in a tiny host CLI.
- If rebuilding, design plugin‑first traits (IndexProvider, UpdateChecker, AcpTransport, UiOverlay), a small event bus, TOML config + env overrides, and a minimal `lexopt` parser — no clap.
