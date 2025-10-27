# Spike – MiniCPM Summarisation & Embeddings (Enhancement 23)

## 1. Goal
Confirm feasibility of running MiniCPM locally to summarise conversation/tool turns before embedding, and define the download/cache workflow under `~/.codex/memory/models`.

## 2. Candidate Artifacts
- Target model: **MiniCPM-Llama3-V2 1.2B (GGUF)** – compact enough for CPU inference.
- Storage path: `~/.codex/memory/models/minicpm/`
  - `model.gguf` – quantised weights (e.g., Q4_K_M).
  - `tokenizer.json`, `config.json` – bundled with release.
  - `manifest.json` – version metadata, checksum, last-updated timestamp.

## 3. Proposed Implementation
1. **Model Manager (`codex-core::memory::model_manager`)**
   - Check `manifest.json`; if missing or outdated, enqueue download task.
   - Downloads performed via existing HTTP client stack once network is available (deferred outside sandbox).
   - Validate checksum, unpack into `models/minicpm`.
   - Expose `ensure_model_ready()` async API returning `MiniCpmHandle`.
2. **Inference Adapter**
   - Use `llama_cpp` crate (already in ecosystem) for GGUF loading.
   - Instantiate a low-temperature generation with short max tokens (<=128) to produce summaries.
   - Provide `summarise(text) -> SummaryResult` returning trimmed string plus confidence heuristic (e.g., logprob average).
3. **Distillation Pipeline Integration**
   - `distill.rs` obtains handle via `model_manager.ensure_model_ready().await`.
   - Summarise combined user/assistant/tool turn text.
   - Embed summary using `fastembed::TextEmbedding`.
   - Compute confidence score: combine cosine norm of embedding with summariser logprob to derive CF%.
4. **Caching & Warmup**
   - Keep MiniCPM context loaded in a background task; reuse across events.
   - Gracefully degrade: if model unavailable, queue event and notify `/memory` manager that distillation is pending.

## 4. Test Harness Concept
```rust
fn main() -> anyhow::Result<()> {
    let model = MiniCpmHandle::load(Path::new("~/.codex/memory/models/minicpm"))?;
    let summary = model.summarise("Discussed adding LightMem-style memory. Next steps include…")?;
    println!("Summary: {}", summary.text);

    let mut embedder = EmbeddingHandle::new(None)?;
    let embedding = embedder.embed(vec![summary.text.clone()])?;
    println!("Embedding dimension = {}", embedding[0].len());
    Ok(())
}
```

## 5. Constraints Observed
- Current sandbox has network restrictions; actual model download and inference could not be executed.
- Need to evaluate binary size (≈1.3 GB for GGUF Q4) and whether we require optional component download gating.
- CPU-only inference may consume ~2–3 GB RAM; confirm acceptable for target users or provide configuration toggle.

## 6. Findings
- MiniCPM’s GGUF artifacts are compatible with `llama_cpp` and align with planned local execution (no BYOK needed).
- Embedding pipeline remains unchanged; summariser just shortens text before `fastembed`.
- Confidence scoring can reuse existing LightMem formula (semantic similarity + recency) with summariser logprob as an additional signal.

## 7. Next Steps
- Implement `model_manager` with resumable downloads and checksum verification.
- Integrate summariser adapter and benchmark summarisation latency on target hardware.
- Calibrate CF% scaling: collect sample interactions and adjust thresholds stored in settings.
