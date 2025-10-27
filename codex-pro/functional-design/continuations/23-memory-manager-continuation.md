## Context Snapshot (Enhancement 23)

- Current branch: aligns with main; no migrations outstanding.
- Memory pipeline is partially implemented:
  - `core/src/memory/recorder.rs`, `distill.rs`, and `store.rs` capture/chat events and append JSONL records under `~/.codex/memory/`.
  - `MemoryDistiller` still uses placeholder summarisation/embedding logic (MiniCPM integration pending).
  - `/memory` slash command opens a read-only overlay (`tui/src/memory_manager.rs`) listing manifest entries; no CRUD or search yet.
- Foundational spikes live in `core/examples/*` and `tui/examples/memory_manager_spike.rs` for reference.
- Requirements tracking in `23-requirement-shards.md` has updated notes under P1.1–P1.5 capturing the current state and outstanding scope.

## Immediate Follow-up Goals

1. **Memory Store CRUD & Lifecycle (P1.3)**
   - Extend `core/src/memory/store.rs` with update/delete/rebuild/reset routines and advisory locking.
   - Ensure API signatures can be called from both CLI and TUI layers (consider async wrappers as needed).
   - Add unit tests for edit/delete/reset flows.

2. **Distillation Worker Parity (P1.2)**
   - Replace deterministic embedding stub with real MiniCPM summariser + `fastembed` path per design docs.
   - Implement download/cache manager saving weights in `~/.codex/memory/models` with checksum validation.
   - Add configurable min-confidence/preview settings persisted via `codex_core::settings`.

3. **TUI Memory Manager MVP (P1.5)**
   - Wire semantic search/filtering (reusing existing async search patterns) and min CF slider.
   - Add hits/misses metrics pane fed by new retriever instrumentation.
   - Implement create/edit/delete/rebuild actions with confirmation dialogs and backend calls.
   - Introduce preview-mode toggle + settings persistence, reflecting real planner behavior.
   - Add snapshot coverage for key states (empty, populated, loading, confirm dialogs).

4. **Retriever & Planner Integration (P1.4)**
   - Build `MemoryRetriever` hybrid scoring path using new store APIs; integrate into prompt planner with preview flow.
   - Track hits/misses and expose metrics to the manager + CLI.

5. **CLI Admin Commands (P1.6)**
   - Implement `codex memory init/reset/rebuild/stats` commands in `cli/src/commands/memory.rs`.

## Suggested Work Order

1. Finalise store CRUD + distiller real model.
2. Integrate retriever metrics and planner preview gating.
3. Flesh out `/memory` overlay (search, filters, actions) once backend APIs are stable.
4. Add CLI commands + documentation updates.
5. Expand tests (unit + snapshot + integration) and update design documents.

## Reference Files & Directories

- `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs/core/src/memory/` — recorder, distiller, store, type definitions (expand here rather than introducing new modules elsewhere).
- `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs/core/src/codex.rs` — session wiring for recorder/distiller (follow existing integration patterns).
- `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs/tui/src/memory_manager.rs` — current overlay implementation (read-only baseline to extend).
- `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs/tui/src/slash_command.rs`, `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs/tui/src/chatwidget.rs`, `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs/tui/src/app.rs`, `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs/tui/src/app_event.rs` — slash command + event plumbing.
- `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/23-context-lightmem/23-requirement-shards.md` — authoritative requirements checklist; mark items complete only once fully implemented.
- `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/23-context-lightmem/23-technical-spec.md` — detailed architecture that must be followed.

## Validation Checklist for Next Agent

- `cargo check`
- `cargo test -p codex-core` (extend with new unit tests)
- `cargo check -p codex-tui --example memory_manager_spike`
- `just fmt`
- `just fix -p codex-core`, `just fix -p codex-tui`
- Snapshot review/acceptance when TUI output changes (`cargo insta pending-snapshots -p codex-tui`)

## Handoff Notes

- All remaining checklist items **must be fully implemented** (no placeholders or stubs). Follow the referenced design documents for expected UX, telemetry, and persistence semantics.
- Ensure new CLI/TUI actions respect existing approval/sandbox toggles.
- Avoid introducing circular deps between `core` and `common`; keep memory types resident in `core`.
- For MiniCPM integration, coordinate model download UX with existing settings prompts (see `23-technical-spec.md`).
- When augmenting planner, verify preview UX aligns with design (preview toggle vs. auto-select).
