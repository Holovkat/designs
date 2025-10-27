# LightMem Context Integration Whitepaper

## Executive Summary
- LightMem (ZJUNLP, 2024) targets the challenge of giving large language model (LLM) agents durable, queryable memory without incurring the costs of very long prompts. It incrementally distills interaction traces into compact "memory cells" that can be retrieved by similarity at inference time.
- Codex-Pro currently retains conversation history in rolling transcripts; long sessions degrade quality and responsiveness. Borrowing LightMem concepts would allow us to keep a lightweight, semantically indexed memory that survives across user sessions and agents.
- We recommend introducing a tiered memory service in `codex-core` that handles capture, summarisation, storage, and retrieval, exposes tooling hooks for the CLI/TUI, and keeps the additional latency under 50 ms median per retrieval.

---

## LightMem at a Glance

### Problem Addressed
- **Context length ceiling**: Commodity LLMs struggle once prompts exceed 16–32k tokens; the marginal cost of keeping full transcripts grows rapidly.
- **Forgetting across sessions**: Without long-term memory, agents repeatedly rediscover user preferences or project state, leading to redundant tool calls.
- **Latency and cost pressure**: Naïve retrieval pipelines (large embeddings, heavy vector DBs) add cold-start latency unsuited to interactive assistants.

### How LightMem Solves It
1. **Memory Cell Construction**: Converts each dialogue turn or tool exchange into a structured record with:
   - short text summary distilled by a small student model (≈128 tokens),
   - semantic embedding produced by a lightweight encoder,
   - rich metadata (participants, tags, timestamps, tool context).
2. **Decoupled Stores**:
   - *Episodic store* keeps temporally ordered slices for recent recall.
   - *Semantic store* maintains a vector index for concept-level lookup.
3. **Retriever-Orchestrator**:
   - Scores candidates via hybrid similarity (embedding + keyword + recency prior).
   - Applies a compact re-ranker (e.g., MiniLM cross-encoder) to finalise top-N memories (<400 tokens).
4. **Context Composer**:
   - Injects the selected memories ahead of the current user turn using controllable templates, ensuring total prompt remains below the LLM budget.
5. **Continual Refinement**:
   - Periodically clusters old memories and re-summarises them to prevent drift.
   - Drops stale items based on decay heuristics or explicit instructions.

### Repo Observations (From Published Materials & Prior Reviews)
- Modular Python stack with FastAPI endpoints and optional LangChain agents.
- Pluggable embedding back-ends (Sentence-Transformers by default, optional BGE/flag-embedding).
- Supports both file-backed FAISS indices and in-memory vector stores; training scripts provided for memory distillation.
- Includes evaluation harness for long-horizon planning benchmarks (ALFWorld, WebShop, text-based games) showing quality improvements with limited compute overhead.
- Provides reference prompts for summarisation and retrieval that can be adapted to other LLMs.

### Known Limitations
- Dependency chain is Python-heavy (PyTorch, FAISS, sentence transformers); porting directly to Rust would be expensive.
- Memory scoring heuristics assume English-language text and may need localisation.
- Continual re-clustering jobs are implemented as batch scripts without orchestration or back-pressure.
- Security and privacy controls (encryption-at-rest, redaction) are left to downstream adopters.

---

## Problem Definition for Codex-Pro
- **Current state**: The Codex-Pro assistant keeps conversations per session, trims oldest turns when reaching context limits, and does not persist knowledge between sessions unless users manually create notes.
- **Pain**: Users re-share project metadata, environment constraints, or coding preferences. This increases token spend, slows completions, and weakens task continuity.
- **Opportunity**: A LightMem-inspired memory layer can provide persistent, semantically searchable context that fuels better tool decisions, reduces redundant questions, and unlocks multi-session planning.

---

## Solution Overview for Our Architecture

### Architectural Touchpoints
- `codex-core::memory` exposes `MemoryRecorder`, `MemoryDistiller`, `MiniCpmManager`, `GlobalMemoryStore`, and `MemoryRetriever`, providing event capture, summarisation, persistence, and query plumbing within one crate.
- `common` gains serde-friendly structs for memory records so CLI/TUI and the MCP toolchain consume a single contract.
- `cli` and `tui` integrate via the shared command registry (`commands::registry`) so both interfaces can surface and mutate memories.
- Optional background worker in `core::tasks` remains on the backlog for compaction/retention once the MVP lands.
- `settings.json` now stores memory enablement, minimum confidence, and preview-mode toggles persisted across sessions.

### Current Implementation Status (October 27, 2025)
- MiniCPM summarisation runs locally through `llama_cpp`, with checksum-verifying download manager, retry/backoff, and deterministic fallback for cold starts.
- `GlobalMemoryStore` (JSONL + HNSW) delivers full CRUD, rebuild/reset lifecycle, and metrics tracking (hits, misses, preview accept/skip) recorded in `metrics.json`.
- `MemoryRetriever` auto-selects the highest-confidence match when preview is disabled and records per-query telemetry; unit tests cover the scoring/metrics contract.
- `/memory` TUI manager provides list/search/edit/create/delete flows, semantic filtering, confidence slider, and confirmation dialogs; VT100-based insta snapshots guard layout changes.
- `codex memory` CLI offers headless admin (init/list/create/edit/delete/search/stats), with an integration test exercising the full CRUD/search loop using a stub MiniCPM cache.


### Data Flow
1. **Capture**: After each assistant turn, `ConversationOrchestrator` emits a `MemoryEvent`. Tools (e.g., file diffs) post structured payloads.
2. **Distil**: A locally hosted MiniCPM model (downloaded on demand into `~/.codex/memory/models`) summarises content to ≤120 tokens and generates embeddings through the existing `fastembed` binding.
3. **Persist**: Records appended to a global JSONL manifest in `~/.codex/memory/`, while embeddings populate a dedicated HNSW graph file. Metadata includes tags, project path, and session id.
4. **Retrieve**: Before building a prompt, the planner queries `MemoryRetriever` with the current task descriptor. Top memories appended as a dedicated section, governed by token budget heuristics.
5. **Refresh**: Idle compactor merges similar memories and prunes stale ones.

---

## Implementation Recommendations (≤5)
1. **Build a Rust-native memory service** using append-only JSONL metadata files and a dedicated HNSW graph under `~/.codex/memory/`, with embeddings powered by `fastembed`.
2. **Adopt LightMem’s dual-store strategy** (episodic + semantic) with a configurable freshness prior so codex-pro can blend recency and relevance per task type.
3. **Integrate summarisation distillation** via the bundled MiniCPM model (downloaded into the global memory directory) to keep memory cells concise without BYOK configuration.
4. **Expose memory controls in the TUI/CLI**: ship a `/memory` slash command that opens a full-screen manager for browsing, searching, editing, and pruning memories, plus administrative actions on the backing graph.
5. **Instrument quality feedback loops** by logging when retrieved memories contribute to successful completions (proxy via reduced retries) to tune scoring weights.

---

## TUI Memory Management Experience
- `/memory` slash command launches a modal/full-screen view tailored for quick auditing and adjustments.
- Recent memories appear first, rendered with timestamps, tags, and truncated summaries to spotlight the newest context.
- Semantic search field (embedding-backed) narrows the list interactively, mirroring retrieval scoring for consistency.
- Inline actions let users edit contents, retag, or delete entries; destructive actions request confirmation.
- Metrics strip reports retrieval hits vs. misses so users can judge memory effectiveness.
- Minimum confidence slider filters visible memories (`score ≥ threshold`) and persists in global memory settings.
- Preview mode toggle controls whether chat surfaces suggested memories for accept/skip or auto-injects the highest-scoring candidate above the threshold.
- Administrative panel offers create/delete/rebuild operations for the dedicated memory HNSW graph, giving users recovery controls without leaving the TUI.

---

## Required Changes in Codex-Pro
- Add new `codex-core::memory` module with storage abstractions, retrieval, and summarisation helpers.
- Extend the planner (`planning::session`) to request memory candidates before each tool/LLM invocation.
- Update the prompt builder to reserve a dedicated “Context Memory” block with token budgeting heuristics.
- Introduce background task scheduler (tokio task) to compact and decay stored memories.
- Amend configuration schema (`settings.rs`) to include memory enablement, retention days, storage path, and privacy toggles.
- Provide a bootstrap command in `cli` to create and maintain the global `~/.codex/memory/` directory structure.
- Enhance the TUI with a `/memory` manager that supports reverse-chronological browsing, semantic filtering, edit/delete controls, hits/misses metrics, minimum confidence slider, preview toggle, and vector-store lifecycle actions (create/delete/rebuild).
- Bundle MiniCPM download management: ensure first-run bootstrap fetches model weights into `~/.codex/memory/models` and exposes status indicators.
- Update planner UI integration so chat previews retrieved memories when enabled and respects auto-select behaviour when disabled.

---

## Expected Benefits & Impact
- **Higher answer accuracy**: more precise context for long-running coding/projects, reducing redundant clarifications.
- **Lower token usage**: summarised memories add <400 tokens per turn versus thousands for raw transcripts.
- **Faster ramp-up**: new sessions start with immediate awareness of user preferences, environment constraints, and external resources.
- **User trust & transparency**: explicit memory inspection commands let users understand and control stored data.
- **Foundation for advanced agents**: persistent memory enables multi-day plans, follow-up tasks, and evaluation loops.

---

## SWOT Analysis of LightMem Adoption
- **Strengths**
  - Proven reduction in prompt length while preserving task success on long-horizon benchmarks.
  - Modular design; retriever and summariser components are separable.
  - Lightweight runtime footprint (<200 MB) when using distilled embeddings.
- **Weaknesses**
  - Python-centric tooling increases integration friction with our Rust stack.
  - Reliance on English datasets; non-English performance uncertain.
  - Heuristic decay rules may misplace critical context without user oversight.
- **Opportunities**
  - Aligns with Codex-Pro’s goal of agentic autonomy and continuity.
  - Memory analytics can feed product features (auto-notes, progress dashboards).
  - Potential to ship as enterprise differentiator (project memory that stays local).
- **Threats**
  - Privacy regulations (GDPR/CCPA) require strict consent and data lifecycle management.
  - Model drift: changes in embedding models could invalidate similarity scores.
  - Competing solutions (LangChain Memory, LlamaIndex) might evolve faster; we must differentiate.

---

## Improvement Areas for Our Implementation
- **Privacy-first design**: introduce encryption at rest and per-project opt-in settings upfront.
- **Semantic calibration**: fine-tune embedding/summariser models on developer-centric corpora to improve relevance.
- **Feedback-aware ranking**: use reinforcement signals (thumbs up/down, resolution status) to adjust retrieval weights.
- **Cross-agent sharing**: allow memory namespace sharing between CLI, TUI, and future MCP agents with access controls.
- **Operational tooling**: build dashboards/CLIs to inspect memory health (size, coverage, decay efficiency).

---

## Roadmap & Milestones
1. **Phase 0 – Exploration (1 sprint)**
   - Prototype Rust memory store with append-only JSONL manifest + HNSW graph backed by `fastembed`.
   - Replicate LightMem retrieval benchmarks using public datasets (ALFWorld subset) to validate parity.
2. **Phase 1 – Core Integration (2 sprints)**
   - Implement `MemoryRecorder`, `MemoryRetriever`, and prompt injection.
   - Build the `/memory` TUI manager (reverse-chronological list, semantic search, edit/delete controls, hits/misses metrics, min CF slider, preview toggle) and wire administrative actions for create/delete/rebuild.
   - Add chat preview experience that lets users accept/skip suggested memories when preview is enabled.
   - Implement MiniCPM on-demand download + local inference pipeline, with progress surfaced in UI/CLI.
3. **Phase 2 – Quality Iteration (1 sprint)**
   - Add background compaction, feedback logging, and analytics hooks.
   - User-test `/memory` workflows (preview vs auto-select) to refine UX and guardrails; incorporate pilot feedback.
4. **Phase 3 – Hardening (1 sprint)**
   - Security review (encryption, access control) and documentation.
   - Prepare launch materials, migration instructions, and operator runbooks for TUI memory management.

> _Status_: Exploration and Phase 1 core integration are largely complete (distillation, retriever, CLI/TUI manager). Remaining work is concentrated in download UX polish, analytics, and documentation ahead of Phase 2.

---

## Risks & Mitigations
- **Overfitting to benchmarks**: Mitigation—collect anonymised telemetry (with consent) to validate on organic workloads.
- **Latency spike from retrieval**: Mitigation—cache embeddings per query, parallelise retrieval with prompt planning.
- **Data sprawl**: Mitigation—enforce retention windows, expose “forget project” command, add quotas.
- **Model dependency churn**: Mitigation—abstract summariser/embedding providers behind traits; version embeddings.

---

## Assumptions & Notes
- GitHub access was unavailable in the current sandbox, so observations rely on published LightMem papers, prior internal reviews, and cached documentation.
- All design proposals assume continued use of Rust/Tokio stack and existing `fastembed` integration for embeddings.
- User consent and privacy requirements must be confirmed with legal/compliance before rollout.

---

## Next Steps
- Validate the prototype plan with core maintainers and align on privacy requirements.
- Spin up a design spike to port LightMem retrieval heuristics into Rust, documenting any deviations.
- Prepare success metrics (task completion rate, token savings, user satisfaction) ahead of pilot rollout.
