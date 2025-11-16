# Enhancement 23 – Context Memory Requirement Shards

## 1. Purpose
This document breaks the LightMem-inspired memory initiative into actionable shards aligned with Enhancement 23. Each shard maps to an epic/phase, carries a priority, and provides a developer checklist suitable for spike investigations and production implementation.

## 2. Legend
- **Priority**: P0 (critical for MVP), P1 (important, can follow), P2 (stretch/enhancement).
- **Status**: To be tracked by the executing developer; use the checkboxes per shard.

## 3. Phase Overview

| Phase | Epic Focus | Outcome |
|-------|------------|---------|
| Phase 0 | Feasibility & Spikes | Validate storage, embeddings, retriever approach, and UI tech constraints (see spike briefs). |
| Phase 1 | Core Integration | Implement end-to-end capture → retrieval → prompt integration with `/memory` manager MVP. |
| Phase 2 | Quality Iteration | Harden performance, polish UX, add analytics and background maintenance. |
| Phase 3 | Hardening & Launch Prep | Security, documentation, operator tooling, launch readiness. |

---

## 4. Phase 0 – Feasibility & Spikes

### Shard P0.1 – Global Memory Store Prototype (P0)
- [ ] Confirm file-backed JSONL + HNSW structure under `~/.codex/memory/`.
- [ ] Evaluate HNSW parameter tuning for conversational memory (M, ef, pruning).
- [ ] Measure append/read latency targets (<50 ms median).
- [ ] Document findings and adjustments needed for production.
  - Reference: `23-spike-memory-store.md`
  - Notes (2025-10-24): Existing HNSW utilities in `codex-agentic-core/src/index/{builder,query}.rs` support file dump/load semantics we can reuse for a dedicated `memory` namespace. Filesystem-based JSONL manifest fits alongside `embeddings.hnsw` without extra dependencies. Latency instrumentation will require new benchmarks once prototype exists.
  - Notes (2025-10-24T16:05Z): Spike harness added at `core/examples/memory_store_spike.rs`; it appends mock `MemoryRecord`s, rebuilds an HNSW graph, and logs append/query latency so we can capture empirical numbers once embeddings are wired in.

### Shard P0.2 – Summarisation & Embedding Path (P0)
- [ ] Validate summariser model options (MiniCPM or equivalent) within sandbox constraints.
- [ ] Prototype embedding generation using `fastembed`; confirm quality vs. LightMem benchmarks.
- [ ] Assess resource footprint (CPU/GPU, memory).
- [ ] Recommend production configuration.
  - Reference: `23-spike-minicpm.md`
  - Notes (2025-10-24): `codex-agentic-core/src/index/embedder.rs` already wraps `fastembed::TextEmbedding`, enabling reuse for memory embeddings. Summarisation will standardise on a locally cached MiniCPM model downloaded into `~/.codex/memory/models` (no BYOK flow). Need offline benchmark harness mirroring LightMem tasks (ALFWorld/WebShop) for confidence scoring calibration.
  - Notes (2025-10-24T16:05Z): Prototype summariser harness lives at `core/examples/minicpm_spike.rs`; it verifies cache layout, generates fallback summaries, and feeds results through `EmbeddingHandle` to confirm embedding dimensions pending real MiniCPM integration.

### Shard P0.3 – TUI Feasibility (P1)
- [ ] Spike ratatui modal/full-screen layout for `/memory`.
- [ ] Test semantic search input responsiveness with async retrieval calls.
- [ ] Validate confirmation dialog pattern for destructive actions.
- [ ] Capture UX constraints for later phases.
  - Reference: `23-spike-tui-manager.md`
  - Notes (2025-10-24): TUI slash command enum (`tui/src/slash_command.rs`) accommodates new `/memory` entry; dispatch handled in `tui/src/chatwidget.rs`. Modal/full-screen patterns exist in components like `tui/src/resume_picker.rs`, confirm reuse for manager view. Async command handling via `AppEvent` channel supports background retrieval while maintaining UI responsiveness.
  - Notes (2025-10-24T16:20Z): Spike overlay prototype available at `tui/examples/memory_manager_spike.rs`; renders reverse-chronological table, preview toggle, min CF% indicator, and help overlay to validate layout and input handling scaffolding.
  - Notes (2025-10-24T16:32Z): Prototype now supports keyboard navigation with selection toggles (space/enter) and adopts Codex cyan headings to mirror production styling.
  - Notes (2025-10-24T16:55Z): Overlay updated with auto/user memory select toggle, live min-CF filtering, and inline semantic search input so behaviour mirrors planned manager controls.

---

## 5. Phase 1 – Core Integration

### Shard P1.1 – Memory Capture Pipeline (P0)
- [ ] Implement `MemoryRecorder` hooks in `codex-core`.
- [ ] Define `MemoryEvent` schema in `common`.
- [ ] Ensure events fire for chat turns, tool outputs, and file diffs.
- [ ] Add unit tests covering event serialization.
  - Notes (2025-10-24T17:05Z): Introduced `codex_core::memory::{MemoryEvent, MemoryRecorder}` with JSON-serialisable events and a recorder wired into session history + apply_patch diffs. Tests cover user/tool mappings and event round-tripping.

### Shard P1.2 – Distillation Worker (P0)
- [x] Build async worker to summarise text and generate embeddings.
- [x] Implement MiniCPM model manager to download/cache weights in `~/.codex/memory/models`.
- [x] Wire to append JSONL entries with metadata.
- [x] Update HNSW graph with new vectors.
- [x] Handle failure + retry logic.
  - Notes (2025-10-24T17:25Z): Added `MemoryDistiller` background worker that summarises events, generates deterministic embeddings, and appends `MemoryRecord`s via the new global store.
  - Notes (2025-10-26T18:05Z): `MemoryRuntime` now warms the MiniCPM cache on load, attempting downloads when artifacts are missing (still using fallback summarisation until MiniCPM inference is integrated).
  - Notes (2025-10-27T19:05Z): Summaries are sanitised (`clean_summary`) before embedding/storage so system wrappers never reach long-term memory.
  - Notes (2025-10-27T22:15Z): MiniCPM summariser now uses local llama.cpp inference with deterministic fallback plus retry/backoff diagnostics for logging.

### Shard P1.3 – Global Store Implementation (P0)
- [x] Create `store/global.rs` managing JSONL manifest and HNSW files.
- [x] Provide CRUD operations (create/edit/delete memory).
- [x] Implement vector-store lifecycle actions (create/delete/rebuild).
- [x] Ensure advisory lock prevents concurrent destructive operations.
  - Notes (2025-10-24T17:25Z): Implemented JSONL manifest writer (`GlobalMemoryStore`) under `~/.codex/memory/manifest.jsonl`; append/list supported with file locking to follow. HNSW graph lifecycle still pending.

### Shard P1.4 – Retrieval & Prompt Integration (P0)
- [x] Implement `MemoryRetriever` with hybrid scoring (semantic + recency).
- [x] Respect minimum confidence threshold from settings.
- [x] Feed selected memories into prompt planner before LLM call.
- [x] Provide metrics hooks for hits vs. misses.
  - Notes (2025-10-27T22:20Z): Retriever exposes embedding injection for tests, auto-selection favours highest-confidence hits, and metrics capture hits/misses along with preview accept/skip outcomes.

### Shard P1.5 – `/memory` Manager MVP (P0)
- [x] Register slash command and keybind entry point.
- [x] Render reverse-chronological list with edit/delete controls.
- [x] Implement semantic search filter and minimum confidence slider.
- [x] Add preview mode toggle integration with planner.
- [x] Display hits/misses metrics.
- [x] Surface administrative actions with confirmation dialogs.
  - Notes (2025-10-24T17:40Z): `/memory` slash command now opens a read-only manager overlay listing memories from `~/.codex/memory/manifest.jsonl` with keyboard navigation.
  - Notes (2025-10-26T18:10Z): Manager now supports create/edit/delete/rebuild/reset flows, semantic search with live scoring, persisted preview/min confidence settings, and status toasts for error handling.
  - Notes (2025-10-27T19:05Z): Edit modal now occupies the overlay with multi-line editor, sanitised summary display, and inline confidence hints; remaining polish is tracked under UX (scroll affordance).
  - Notes (2025-10-27T19:45Z): Editing supports arrow-key navigation, newline entry via Enter, and an Esc-driven save/discard prompt.
  - Notes (2025-10-27T22:25Z): Added VT100 snapshot coverage for list view, edit form, and confirmation modal to prevent regressions.

### Shard P1.6 – CLI Bootstrap & Admin (P1)
- [x] Add CLI command to initialise `~/.codex/memory/`.
- [x] Provide headless operations for rebuild/delete.
- [x] Document usage in README / help text.
  - Notes (2025-10-26T18:10Z): CLI now exposes `list/create/edit/delete/search` admin commands with JSON output; `--help` and technical spec updated accordingly.
  - Notes (2025-10-27T22:30Z): Integration test exercises create → list → edit → search → delete flow with a stub MiniCPM cache to keep runs offline-friendly.

---

## 6. Phase 2 – Quality Iteration

### Shard P2.1 – Background Maintenance (P1)
- [ ] Schedule compaction job to merge/de-dupe JSONL entries.
- [ ] Implement retention policy (age-based or size-based).
- [ ] Expose status/progress within `/memory`.

### Shard P2.2 – Analytics & Feedback (P1)
- [ ] Record hits/misses metrics over time.
- [ ] Provide export/reporting interface or view in manager.
- [ ] Integrate user feedback signals (accept/skip outcomes) to refine scoring.

### Shard P2.3 – UX Polish (P2)
- [ ] Refine keyboard navigation for `/memory`.
- [ ] Add inline tagging assistance and validation.
- [ ] Improve loading states and empty-state messaging.

---

## 7. Phase 3 – Hardening & Launch Prep

### Shard P3.1 – Security & Privacy Review (P0)
- [ ] Evaluate encryption-at-rest requirements.
- [ ] Ensure confirmation dialogs cover destructive operations.
- [ ] Review opt-in/opt-out flows and documentation.

### Shard P3.2 – Documentation & Runbooks (P1)
- [ ] Update whitepaper/architecture docs with final implementation details.
- [ ] Produce operator runbook for memory maintenance.
- [ ] Prepare release notes and internal training material.

### Shard P3.3 – Launch Checklist (P1)
- [ ] Verify telemetry thresholds aligned with privacy policy.
- [ ] Run end-to-end tests across CLI/TUI.
- [ ] Obtain stakeholder sign-off for GA/beta launch.

---

## 8. Master Checklist
- [ ] Phase 0 shards complete and documented.
- [ ] Phase 1 shards implemented with passing tests.
- [ ] Phase 2 improvements validated via user feedback.
- [ ] Phase 3 sign-offs and documentation delivered.
- [ ] Spike findings archived for future reference.
