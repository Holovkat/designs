# 23 — Memory Manager & Context Store Implementation

## Overview

This playbook captures the full implementation of Enhancement 23: long-lived memory for Codex. It builds on the planner orchestration (21) and unified provider handling (22) to deliver a persistent context store backed by MiniCPM summarisation, a file-based manifest + HNSW index, CLI tooling, and a `/memory` TUI manager with preview workflows.

The document is the authoritative reference for recreating or iterating on the memory stack in future releases.

## Prerequisites

- Phase -1 baseline complete (repository builds/tests clean, feature branch active).
- Prior enhancements applied: command registry (05/06), index status (07/08), provider reasoning (22), planning tool orchestration (21).
- Rust toolchain 1.89.0 (`rustup override set 1.89.0`).
- MiniCPM weights hosted at `~/.codex/memory/models/minicpm/` (downloaded on first run by the model manager).

## Component Map & Responsibilities

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `memory::model_manager` | `core/src/memory/model_manager.rs` | Downloads & verifies MiniCPM GGUF/tokenizer assets, exposes summarisation API, surfaces diagnostics & download state. |
| `memory::distill` | `core/src/memory/distill.rs` | Runs background worker to summarise events via MiniCPM + `fastembed`, appends memory records, exposes `MemoryRuntime` for CLI/TUI. |
| `memory::store` | `core/src/memory/store.rs` | Persist manifest (`manifest.jsonl`), embeddings graph (`embeddings.hnsw`), metrics (`metrics.json`); provides CRUD + rebuild/reset. |
| `memory::retriever` | `core/src/memory/retriever.rs` | Semantic retrieval with confidence filtering, metrics accounting, preview auto-selection. |
| Planner wiring | `core/src/codex.rs`, `core/src/state/turn.rs`, `core/src/rollout/policy.rs` | Injects retrieved memories into prompts, emits preview events, records accept/skip outcomes. |
| Runtime bridges | `exec/src/event_processor_with_human_output.rs`, `mcp-server/src/codex_tool_runner.rs` | Handle `MemoryPreview` events for non-TUI clients. |
| CLI admin | `cli/src/memory_cmd.rs` | `codex memory` subcommands (init/list/search/create/edit/delete/rebuild/reset/stats) with MiniCPM diagnostics. |
| TUI manager | `tui/src/memory_manager.rs`, `tui/src/memory_preview_overlay.rs` | `/memory` overlay with list/search/edit flows, confidence slider, preview toggles, download status, scroll indicators. |
| Settings | `core/src/memory/settings.rs`, `settings.json` | Stores `enabled`, `min_confidence`, `preview_mode`, `max_tokens`, `retention_days`. |

## Implementation Steps

1. **Introduce Memory Module (`core/src/memory/`)**
   - Create module tree with `mod.rs` re-exporting `MemoryRuntime`, `MemoryDistiller`, `GlobalMemoryStore`, `MiniCpmManager`, etc.
   - Implement `model_manager.rs` to manage GGUF/tokenizer downloads (checksum via SHA256), status inspection, and llama.cpp inference wrapper with retry/backoff.
   - Add `distill.rs` worker: spawn background task, summarise incoming `MemoryEvent` via MiniCPM, embed via `fastembed::TextEmbedding`, append to store. Provide `MemoryRuntime::load` and helper accessors (`model_manager`, `create_record`, `update_record`, `search_records`, metrics getters).
   - Build `store.rs`: JSONL manifest append/update, HNSW persistence (via existing `hnsw_rs` helpers), metrics tracking (hits, misses, preview accept/skip) with advisory locking. Include rebuild/reset APIs.
   - Implement `retriever.rs`: query HNSW, apply confidence filtering, record metrics, expose `MemoryRetrieval::auto_selected` + tests.
   - Define shared structs in `types.rs`: `MemoryEvent`, `MemoryRecord`, `MemoryHit`, `MemorySettings`, `MemoryMetrics`, `MemoryStats`, `clean_summary` helper.

2. **Wire Capture & Planner Integration**
   - Update `core/src/codex.rs` to instantiate `MemoryRuntime`, enqueue events after user/assistant/tool outputs, inject retrieved summaries into planner context, emit `EventMsg::MemoryPreview` for manual approval flows, and mark hits/misses.
   - Extend `core/src/state/turn.rs` to track preview candidates and `memory_context_inserted` flag.
   - Modify `core/src/rollout/policy.rs` to exclude `MemoryPreview` events from rollouts.
   - Ensure non-TUI consumers (`exec` + `mcp-server`) gracefully consume preview events (no-op today).

3. **Add CLI Administrative Surface**
   - Register new subcommand in `cli/src/main.rs` (`codex memory`).
   - Implement `cli/src/memory_cmd.rs` providing `init`, `list`, `create`, `edit`, `delete`, `search`, `rebuild`, `reset`, and `stats` actions using `MemoryRuntime`.
   - Include download/diagnostics output via `MiniCpmManager::status()`, `download_state()`, `diagnostics()`.
   - Normalise confidence parsing (`--confidence` accepts 0–1 or percentage inputs) and ensure tags update metadata.

4. **Build TUI Overlays**
   - Implement `/memory` manager in `tui/src/memory_manager.rs`: reverse-chronological list, semantic search, min-confidence slider, preview mode toggle, CRUD modal, rebuild/reset confirmations, metrics display, MiniCPM status line, scroll indicators.
   - Add keyboard shortcuts: `[S]earch`, `[m]` toggle, `[+]`/`[-]` for confidence, `[n]` create, `[enter]` edit, `[d]` delete, `[r]` rebuild, `[Shift+R]` reset.
   - Provide semantic search integration with highlight scores, manual selection override handling, status toasts.
   - Introduce preview overlay (`tui/src/memory_preview_overlay.rs`) for accept/skip interactions when planner requests confirmation.
   - Accept `/memory` slash command in `tui/src/chatwidget.rs` and event plumbing in `tui/src/app_event.rs`.

5. **Integrate Settings & Persistence**
   - Extend `MemorySettingsManager` to load/persist `memory/settings.json`, clamp confidence, expose update helpers.
   - Ensure CLI/TUI operations persist updated `min_confidence`, `preview_mode`, etc.

6. **Expose Diagnostics & UX Polish**
   - Surface MiniCPM status/download progress in TUI header and CLI `stats` output (ready/missing artifacts, checksum validation, last failure message).
   - Add scroll indicators (`▲`/`▼` plus “start-end of total”) in manager list view.
   - Ensure metrics display (hits/misses/preview counts) synchronises after each operation.

7. **Documentation & Continuation Updates**
   - Refresh `23-context-lightmem` design assets, requirement shards, whitepaper, technical spec, architecture overview, quick-start guide, and continuation briefs with latest scope/status.
   - Add this implementation playbook and reference it from `00-IMPLEMENTATION-CHECKLIST.md` and `QUICK-START-AGENT-GUIDE.md`.

## Validation Checklist

Run the following after changes:

```bash
# Core retrieval tests
cargo test -p codex-core memory::retriever::tests

# TUI (snapshots will update on first run; review via cargo insta)
cargo test -p codex-tui

# CLI memory flow
cargo test -p codex-cli memory_cli_crud_flow

# Smoke check binaries
cargo check -p codex-cli --bin codex-agentic
cargo check -p codex-tui --example memory_manager_spike
```

Manual confirmation:
- `codex memory init/list/search` (ensures MiniCPM status printed).
- Launch TUI (`cargo run -p codex-cli --bin codex-agentic`) and run `/memory`; verify list, semantic search, confidence slider, modal flows, download status line.
- Trigger planner retrieval (send a user turn with memory matches) and confirm preview overlay renders with accept/skip controls.

## 2025-11-06 Performance Hardening

- **Lazy embedder initialisation** — `MemoryRuntime::load` and the distiller now populate the FastEmbed encoder via a `OnceCell`. If `/memory` is disabled (the default on Codex Pro), the embedder never loads. When enabled, the encoder initialises on the first summarisation or retrieval request inside a background blocking task so startup no longer pegs every core.
- **Retriever behaviour** — The CLI/TUI retrieval path tolerates the warm-up window by returning empty hits until the embedder is available. Subsequent queries reuse the shared encoder without reinitialising it.
- **HNSW reuse** — `GlobalMemoryStore::open` inspects the on-disk `.hnsw.graph/.data` files and only rebuilds the graph if the manifest changed or the index is missing. Clean launches now skip the full rebuild while manual mutations (`create`, `update`, `delete`, `reset`) still trigger index regeneration.
- **Operational tip** — If developers need to force a rebuild after manual file edits, run `codex memory rebuild` (which still calls `store.rebuild()` explicitly). Otherwise the system will reuse the existing index automatically.
- **Validation** — Confirm the lazy path with `/memory` disabled (`cargo run -p codex-cli --bin codex-agentic`) and ensure CPU usage stays near idle during startup; when enabling `/memory`, expect the first retrieval or summarisation to incur a one-off initialisation cost.

## Learnings & Recommendations

- Reuse planning infrastructure (Enhancement 21) to inject preview events; keep UI/state in sync by storing hits per turn.
- Align provider behaviour (Enhancement 22) with memory by ensuring tool gating respects providers lacking function-call support; fallback summariser keeps pipeline resilient when MiniCPM assets download later.
- Keep memory store format append-only for stability; HNSW rebuild should run after any destructive operation (reset/delete) and should tolerate empty manifests.
- Diagnostics are critical: surface download progress, last failure, and ready/missing artifact lists in both CLI and TUI to eliminate blind spots.

## Follow-Ups / Future Enhancements

- Inline MiniCPM download progress into planner events and CLI/TUI banner streaming.
- Add compaction/retention jobs (age or size based) and optional encryption-at-rest.
- Broaden test coverage with integration tests for preview accept/skip flows spanning CLI/TUI + planner acceptance.
- Extend metrics reporting (histograms, hit/miss ratios) to analytics pipeline.

## Related Documents

- `21-PLANNING-TOOL-ORCHESTRATION.md`
- `22-UNIFIED-PROVIDER-REASONING-HANDLING.md`
- `23-context-lightmem/23-technical-spec.md`
- `23-context-lightmem/MEMORY-ARCHITECTURE.md`
- `00-IMPLEMENTATION-CHECKLIST.md`
- `QUICK-START-AGENT-GUIDE.md`
