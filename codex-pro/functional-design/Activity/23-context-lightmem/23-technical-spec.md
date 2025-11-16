# Enhancement 23 – Context Memory Technical Specification

## 1. Scope
- Deliver a global, LightMem-inspired memory system for Codex-Pro covering capture, distillation, storage, retrieval, and UX controls.
- Support CLI and TUI experiences, including the `/memory` manager and chat preview flow.
- Persist configuration and operating data within `~/.codex/memory/` and existing `settings.json`.

## 2. Goals & Non-Goals
- **Goals**
  - Provide durable, semantically searchable memory across sessions and projects.
  - Keep retrieval latency under 50 ms median per query.
  - Offer transparent user controls (view, edit, delete, adjust thresholds, preview behaviour).
  - Track retrieval effectiveness (hits vs. misses) for debugging and future analytics.
- **Non-Goals**
  - Multi-user multi-tenant server; scope is local desktop application.
  - Strong encryption at rest (defer to follow-up security review).
- Automatic model fine-tuning; rely on packaged MiniCPM summariser and `fastembed` embeddings.

## 3. System Architecture

### 3.1 Modules & Responsibilities
- `codex-core::memory`
  - `recorder`: subscribes to conversation orchestrator and tool pipelines, emitting `MemoryEvent`.
  - `distill`: summarises events via local MiniCPM, generates embeddings via `fastembed`, packages `MemoryRecord`.
  - `model_manager`: downloads/caches MiniCPM weights under `~/.codex/memory/models` and coordinates access.
  - `store::global`: manages JSONL manifest and HNSW graph, exposes CRUD + lifecycle APIs.
  - `retriever`: hybrid scoring, minimum confidence enforcement, metrics accounting.
  - `preview`: orchestrates accept/skip workflow when preview mode enabled.
- `common::memory`
  - Shared structs: `MemoryEvent`, `MemoryRecord`, `MemoryQuery`, `MemoryAction`.
- `tui::memory_manager` + supporting modules
  - Render `/memory` manager, semantic search, modal editing, confirmations, and keyboard controls.
- `tui::memory_preview_overlay`
  - Manual preview accept/skip UI with insta snapshot coverage.
- `tui::services::memory_client`
  - Async bridge between UI and core memory APIs.
- `tui::app::commands::memory`
  - Slash command/wrapper to launch manager.
- `cli::memory_cmd`
  - Headless bootstrap and administrative commands with integration tests.
- `settings`
  - Extend global settings with memory configuration (enablement, min confidence, preview toggle).

### 3.2 Data Flow
1. Orchestrator emits `MemoryEvent` after each turn/tool output.
2. Recorder queues event to `distill` worker (Tokio task).
3. `distill` ensures MiniCPM weights are available (download if needed), runs summarisation via local `llama_cpp` inference plus `fastembed`, builds `MemoryRecord`.
4. `store::global` appends JSONL line (`manifest.jsonl`) and updates `embeddings.hnsw`.
5. Planner queries `retriever` with `MemoryQuery` before LLM invocation.
6. `retriever` loads candidate IDs from HNSW, applies recency/metadata filters, updates hits/misses metrics.
7. If preview mode enabled, UI surfaces candidate list for accept/skip; selected items forwarded to planner for prompt assembly.
8. `/memory` manager operations (edit/delete/rebuild) call `store::global` APIs; destructive actions require confirmation.
9. Minimum confidence value read from settings determines both UI filtering and retriever thresholds.

### 3.3 Storage Layout
- Directory: `~/.codex/memory/`
  - `manifest.jsonl`: append-only metadata entries.
  - `embeddings.hnsw`: binary graph (one per memory namespace).
  - `metrics.json`: hit/miss counts and timestamps.
  - `lock`: advisory file for exclusive operations.
  - `snapshots/`: optional compaction outputs.
- `models/`: cached MiniCPM weights and tokenizer assets (checksum-verified).

## 4. APIs & Interfaces

### 4.1 Core Types (Rust)
```rust
pub struct MemoryEvent {
    pub event_id: Uuid,
    pub source: MemorySource,      // ChatTurn | ToolOutput | FileDiff
    pub text: String,
    pub metadata: MemoryMetadata,
    pub timestamp: DateTime<Utc>,
}

pub struct MemoryRecord {
    pub record_id: Uuid,
    pub summary: String,
    pub embedding: Vec<f32>,
    pub metadata: MemoryMetadata,
    pub confidence: f32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub struct MemoryQuery {
    pub embedding: Vec<f32>,
    pub max_results: usize,
    pub min_confidence: f32,
    pub filters: MemoryFilters,
}
```

### 4.2 Store Trait
```rust
pub trait MemoryStore {
    fn append(&mut self, record: MemoryRecord) -> Result<()>;
    fn update(&mut self, record: MemoryRecord) -> Result<()>;
    fn delete(&mut self, record_id: &Uuid) -> Result<()>;
    fn fetch(&self, ids: &[Uuid]) -> Result<Vec<MemoryRecord>>;
    fn query(&self, query: &MemoryQuery) -> Result<Vec<MemoryRecord>>;
    fn rebuild(&mut self) -> Result<()>;
    fn reset(&mut self) -> Result<()>;
    fn stats(&self) -> Result<MemoryStats>; // hits, misses, counts
}
```

### 4.2a Runtime Helpers
- `MemoryRuntime::load` warms the MiniCPM cache (download-on-miss) and instantiates the shared fastembed handle.
- `MemoryRuntime::create_record` / `update_record` / `delete_record` wrap store operations with embedding + clamping logic for manual admin surfaces.
- `MemoryRuntime::search_records` returns `MemoryHit` entries (score + record) for CLI/TUI consumers, enforcing optional confidence thresholds.
- `MemoryRuntime::list_records` provides reverse-chronological snapshots for management UIs.

### 4.3 Settings Extension
```json
"memory": {
  "enabled": true,
  "min_confidence": 0.75,
  "preview_mode": "enabled", // enabled | disabled
  "max_tokens": 400,
  "retention_days": 30
}
```

### 4.4 CLI Commands
- `codex memory init` – create directory and seed config.
- `codex memory rebuild` – force rebuild of HNSW graph.
- `codex memory reset` – delete manifest + graph (confirmation required).
- `codex memory stats` – display hits/misses, record count, disk usage.
- `codex memory list` – reverse-chronological listing that honours configured min confidence by default (`--all`, `--limit`, `--json`).
- `codex memory create` – append a manual memory with tags/source/confidence handling (`--summary/--stdin`, clamps percent inputs, `--json`).
- `codex memory edit` – mutate summary, tags, confidence, or source for an existing record (preserves fields not provided).
- `codex memory delete` – remove a record by id with confirmation unless `--yes` is supplied.
- `codex memory search` – semantic lookup returning scored hits; supports confidence override and JSON output for tooling.
- `codex memory stats` – reports totals, hits/misses, preview accept/skip counters, disk usage, and last rebuild timestamp.

### 4.5 TUI `/memory` Actions
- `List` (reverse chronological, filtered by min confidence).
- `Search` (semantic query, asynchronous).
- `Edit` / `Delete` with confirmation.
- `Create` new memory (manual entry).
- `Adjust min confidence` (persist).
- `Toggle preview mode` (persist).
- `Rebuild` / `Delete store` (confirmation dialogs).

## 5. Dependencies & Tooling
- `llama_cpp` crate for MiniCPM summarisation (CPU-backed GGUF inference).
- `fastembed` crate for embeddings.
- HNSW library (existing `codex-agentic-core` implementation reused/adapted).
- `serde`/`serde_json` for manifest.
- `tokio` for async workers.
- MiniCPM summariser distributed via downloadable artifact stored under `~/.codex/memory/models`; inference invoked locally (no BYOK dependency).

## 6. Telemetry & Metrics
- Record retrieval hits, misses, and preview accept/skip outcomes.
- Persist metrics in `metrics.json`; aggregate for display in `/memory`.
- Optional: log to existing analytics pipeline (behind opt-in).

## 7. Error Handling & Recovery
- Failed summarisation/embedding should log and retry (with backoff); on repeated failure, record flagged but not indexed.
- HNSW rebuild runs on background task; show progress and handle cancellation.
- Destructive operations guard with confirmation dialogs and backup snapshot.

## 8. Testing Strategy
- Unit tests for recorder, store, retriever logic (mock embeddings).
- Integration test: capture → distill → retrieve path.
- TUI snapshot tests for `/memory` list/edit/confirmation states (insta + VT100 backend).
- CLI commands tested via integration harness covering create → list → edit → search → delete.

### 4.6 Validation Artifacts
- **Unit tests**: `core/src/memory/retriever.rs` (`auto_select_prefers_highest_confidence`, `records_miss_when_no_candidates`, `preview_skip_records_metric`).
- **Snapshot tests**: `tui/src/memory_manager.rs` (VT100-based), `tui/src/memory_preview_overlay.rs` instructions line.
- **Integration tests**: `cli/tests/memory.rs` (CRUD/search happy path), ensures stub MiniCPM cache keeps run offline-compatible.


## 9. Appendices
- Refer to `WHITEPAPER.md`, `MEMORY-ARCHITECTURE.md`, and `23-requirement-shards.md` for contextual design, diagrams, and task breakdowns.
