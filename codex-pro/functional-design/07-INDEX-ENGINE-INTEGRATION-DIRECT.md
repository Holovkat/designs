---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 07 — Index Engine Integration (What / Where / How / Why / When)

What
- A local semantic index with build, query, status, verify, clean, and ignore controls.

Where
- Code: `codex-rs/codex-core/src/index/` (engine API), invoked from the launcher.
- Data: `.codex/index/` in the project directory containing `manifest.json`, `meta.jsonl`, `vectors.hnsw` (+ graph/data), `analytics.json`, `lock`.

How (Libraries & Structure)
- Embeddings: `fastembed` (BGE-small default; BGE-large optional).
- ANN search: `hnsw_rs` for approximate nearest neighbor queries over vectors.
- File discovery: `ignore::WalkBuilder` + a custom ignore matcher using `.index-ignore` (glob-like).
- Chunking: `auto` (parser-assisted where available) or `lines` with `--lines` and `--overlap`.
- Concurrency: worker pool; throttle ONNX intra-threads per worker to avoid oversubscription; restore on drop.
- Events: `IndexingStarted{total_files}`, periodic `IndexingProgress{processed,total}`, terminal `IndexingCompleted` or `IndexingError{message}`.
- Incremental: reuse embeddings for unchanged files; drop removed files; update checksums.

Why
- On-device search for fast, private context; incremental builds keep rebuild times low.

When (Triggers)
- Manual: `index build` from CLI (when implemented).
- Background: post-turn refresh if allowed by settings and backoff window.

Steps
1) Implement `build_with_progress(args, sender)` emitting the events above.
2) In the launcher, run the build in the configured `cwd` as a blocking task; forward events to the TUI sender.
3) Implement `query`, `status`, `verify`, `clean`, and `ignore` subcommands per CLI spec.

Verification
- Build shows live progress; manifest/analytics are updated; queries return top‑K with snippets when requested; verify passes.

Find / Insert Map (grounded in current code)
- codex-rs/file-search/src/lib.rs (for reference to file discovery patterns)
  - Reference implementations for: file discovery with `ignore::WalkBuilder`, traversal patterns.
  - Anchors: similar patterns used in file search functionality.
- codex-rs/tui/src/app.rs and codex-rs/tui/src/chatwidget.rs
  - Find: TUI event handling patterns to understand how to forward indexing events.
  
Acceptance Criteria
| Item | Must be true |
|---|---|
| Storage | `.codex/index/` contains manifest.json, analytics.json, vectors.hnsw*, meta.jsonl, lock |
| Events | TUI receives IndexingStarted/Progress/Completed/Error in the expected order |
| Incremental | Rebuilds reuse embeddings and drop deleted files |

Replace Protocol (retrieval threshold)
- This will be implemented when the index functionality is added to the core system.