# Spike – Memory Store Prototype (Enhancement 23)

## 1. Goal
Validate that Codex-Pro can persist LightMem-style records using an append-only JSONL manifest plus an HNSW graph stored under `~/.codex/memory/`, reusing existing indexing utilities for vector management.

## 2. Key References
- HNSW builder: `codex-agentic-core/src/index/builder.rs`
- HNSW query loader: `codex-agentic-core/src/index/query.rs`
- Embedding wrapper (`fastembed`): `codex-agentic-core/src/index/embedder.rs`

## 3. Proposed Prototype
1. Create a standalone binary (temporary crate or `cargo run` target) under `codex-core/examples/memory_store_spike.rs`.
2. Binary flow:
   ```rust
   let root = dirs::home_dir()?.join(".codex/memory");
   let manifest_path = root.join("manifest.jsonl");
   let hnsw_dir = root.join("memory-store");
   ensure_dir(&hnsw_dir)?;
   let mut store = MemoryStore::open(root)?;

   let record = MemoryRecord::new("Discuss project X", vec![...], metadata);
   store.append(record)?;
   let hits = store.query(&query_embedding)?;
   println!("{hits:?}");
   ```
3. Implement `MemoryStore::append/query` by adapting:
   - JSONL write similar to `write_chunk_records` but simplified (just serde serialization per line).
   - HNSW build using `Hnsw::<f32, DistCosine>` with `file_dump`/`load_hnsw` mirroring the existing index.
4. Add timing instrumentation around append/query to check <= 50 ms median latency (e.g., `Instant::now()`).

## 4. Constraints Observed
- Current sandbox does not persist new crates without updating Cargo manifests; spike kept as design only.
- No network access; unable to import additional crates beyond existing workspace dependencies.
- HNSW utilities expect workspace-specific metadata; need thin wrapper to map memory record IDs to HNSW `DataId`.

## 5. Findings
- Reusing `codex-agentic-core` HNSW logic is straightforward: builder already handles `file_dump`, and query side uses `HnswIo::load_hnsw`, which we can point to a new basename (e.g., `memory_store`).
- JSONL manifest can leverage `serde_json::to_writer` per record; chunk analytics code is optional.
- Latency instrumentation requires actual run; estimated to satisfy target since embedding is dominant cost.
- Need to define deterministic mapping between record UUID and HNSW integer ID (e.g., maintain `index.json` that maps UUID → `usize`).

## 6. Next Steps
- Implement prototype binary and run locally to capture empirical latency.
- Extend spike with simple CLI commands (`append`, `query`) to exercise workflows.
- Once validated, migrate logic into `codex-core::memory::store::global`.
