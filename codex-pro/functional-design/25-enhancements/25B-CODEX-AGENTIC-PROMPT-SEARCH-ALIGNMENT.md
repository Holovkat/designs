# 25B — Codex-Agentic Prompt & Search Alignment

## Context
- Goal: ensure the assistant reliably invokes the semantic index when users request searches, aligning system prompt overlays with `/search-code`.
- References: `04-SYSTEM-PROMPT-INJECTION-BUILD.md`, `07-INDEX-ENGINE-INTEGRATION-DIRECT.md`, `08-TUI-INDEX-STATUS-INTEGRATED.md`, `19-SEARCH-CODE-SLASH-COMMAND.md`, `22-UNIFIED-PROVIDER-REASONING-HANDLING.md`, `23-MEMORY-MANAGER-IMPLEMENTATION.md`, `00-IMPLEMENTATION-CHECKLIST.md`.

## Worktree & Branch Requirements
- Avoid editing within `/Users/tonyholovka/workspace/codex-pro/codebase/codex-pro/codex-rs`. **All work for 25B must happen inside the pre-created worktree only.**
- Use the existing worktree that tracks `origin/main`:
 1. `cd /Users/tonyholovka/workspace/codex-pro/codebase/codex-pro`
 2. `cd codex-rs-worktrees/prompt-search`
 3. `git status -sb` (should show `feature/prompt-search-alignment...origin/main`)
- Keep all modifications, staging, commits, formatting, and tests inside this worktree—do not touch the main checkout.

## Objectives
1. Inject explicit guidance into the system prompt overlay directing the agent to use `/search-code` when code lookup is requested.
2. Ensure prompt composition in `codex-agentic-core::prompt` reflects index availability before adding the directive.
3. Update slash-command help/usage strings so user-facing copy matches expectations.
4. Trim memory prompt injections to a lightweight glossary and expose an on-demand fetch tool so the LLM can dereference full shards only when needed.

## Implementation Outline
- Add a `PromptHints` helper (or equivalent) that conditionally appends search guidance when `.codex/index/manifest.json` reports a healthy index.
- Update overlay aggregation per doc 04 so the hint coexists with user-provided `.md` overlays.
- Refresh `/search-code` usage strings and examples surfaced via TUI/CLI (doc 19) to mention confidence filtering and semantic scope.
- Collapse duplicated memory summaries before rendering the manager list and prevent duplicate shards from being re-injected into the prompt within the same conversation turn.
- Replace full memory shard injections with glossary entries in the prompt (`[mem_id] summary`) and surface a `memory_fetch` tool (MCP-style) that returns the complete shard text when the LLM asks for it.
- Adjust planner/system prompt tests accordingly.

## Reminder
- Implemented a `PromptHints` pipeline in `codex-agentic-core/src/prompt.rs` that checks the local index manifest and analytics before appending a `/search-code "<keywords>"` directive to the system prompt overlay. The hint is merged for overlay reads, globals, and config application so ACP, CLI, and TUI all see consistent guidance.
- Refreshed `/search-code` messaging in ACP (`codex-agentic-core/src/acp/stdio.rs`) and the TUI slash-command list (`tui/src/slash_command.rs`) to call out semantic scope and the stored confidence threshold.
- Added targeted unit coverage for the new hint logic and reran the scoped suites: `cargo test -p codex-agentic-core prompt`, `cargo test -p codex-tui -- --test-threads=1`, and the build gate `cargo build -p codex-cli --bin codex-agentic`.
- Planned memory optimisations: dedupe manifest entries, show a succinct glossary in prompts, and let the LLM call `memory_fetch` to expand specific shard IDs when deeper context is required.
- The `fastembed` cache lock causes `cargo test -p codex-tui` to occasionally fail when the suite is parallelised; forcing `--test-threads=1` keeps the snapshot-based tests stable.
- `just fix -p codex-agentic-core` can take long enough to trip the default CLI timeout; rerunning without changing scope succeeded, so plan for a longer window when Clippy needs to rebuild large dependency graphs.

## Validation & Handoff
- Execute in the worktree:
  - `just fmt`
  - `just fix -p codex-agentic-core`
  - Update or add unit tests around prompt composition (`cargo test -p codex-agentic-core prompt`)
  - `cargo test -p codex-tui` if slash-command UI strings change
  - **Mandatory build gate**: `cargo build -p codex-cli --bin codex-agentic`
- Manual scenario: simulate a request such as “search for foo() usage” and confirm the generated plan recommends `/search-code`.
- After successful build, await UAT verification before updating `00-IMPLEMENTATION-CHECKLIST.md`.

## Memory Optimisation Checklist
- [x] Collapse duplicate memory records when loading for the TUI memory manager (UI dedupe + optional counters).
- [x] Prevent duplicate shards from being injected into the prompt within the same conversation turn (track injected memory IDs).
- [x] Replace full-shard prompt injections with glossary entries that expose stable memory IDs.
- [x] Expose a `memory_fetch` tool that returns full shard contents when the LLM requests them.
- [x] Update ingestion to avoid writing duplicate manifest entries (hash-based or key-based dedupe).
- [ ] Add unit and integration coverage for the glossary format and tool call flow.

## Memory Glossary & Fetch Tool Flow
- `GlobalMemoryStore::prune_records` trims duplicate manifest rows during `open()`, keeping the newest `updated_at` (and newest `created_at` when timestamps tie) before rebuilding the HNSW index. When duplicates are removed the manifest is rewritten in-place so subsequent launches stay clean.
- Append/update paths share the same dedupe key (`summary + conversation + role + source`) so repeat greetings like “hi” no longer accumulate copies during manual testing.
- Session state tracks `memory_ids_injected`, preventing glossary entries already surfaced earlier in the conversation from being injected again within the same session.
- Prompt overlays now emit a compact glossary `"[memory-id] summary"` list. The LLM dereferences details via the MCP-style `memory_fetch` tool, which accepts either a single `id` or an `ids` array.
- Outstanding validation work:
  - [ ] Snapshot or golden tests that exercise the glossary prompt formatting.
  - [ ] Integration coverage showing the model calling `memory_fetch` and the handler returning the reconstructed shard payload.

## Proposed Pull-Based Memory Flow

Goal: switch from “always push a glossary” to “model requests memories when needed,” mirroring the `/search-code` workflow.

### Runtime contract
- Introduce a new tool (working name `memory_suggest`) that accepts `{ query?: string, top_k?: u8 }`. ✅ implemented in `core/src/tools/handlers/memory_suggest.rs`.
  - Default query: fall back to the latest user message when the model omits it.
  - Returns a markdown list mirroring the current glossary plus preview metadata and explicit next-step guidance (e.g., “Call `memory_fetch` for any IDs you need verbatim.”).
  - Includes preview-mode state; when manual approval is required, the tool responds with an error instructing the LLM to ask the user first (so we preserve the preview dialog).
- Retain `memory_fetch` as-is; it now follows the suggest call instead of a push.
- Deprecate auto-injection in `inject_memory_context`; the method becomes a no-op unless feature-flagged.

### Prompt / instruction updates
- Add overlay copy alongside the `/search-code` hint: “When you need stored context, call `memory_suggest` before answering; then call `memory_fetch` for specific IDs.” ✅ shipped in `codex-agentic-core/src/prompt.rs`.
- Planner / ACP help text should show the new flow (similar to how `/search-code` usage is documented).
- Enforce a 48 KiB budget for combined system instructions (built-ins + overlays). Requests that exceed the cap now fail fast with an actionable error, and the operator docs (`docs/config.md`, `docs/getting-started.md`) describe how to trim instructions when this trips.

### TUI + CLI UX
- Add `/memory-suggest [query]` slash command: ✅ implemented (`tui/src/slash_command.rs`, `tui/src/chatwidget.rs`, `tui/src/app.rs`).
  - Without args, it pre-fills the latest user text. ✅ prompts the user via `MemorySuggestPrompt`.
  - Results display in a transcript cell that mirrors the existing memory manager list (including `[t]` markers). ✅ rendered by `MemorySuggestionsCell`.
- CLI parity: `codex memory suggest --query "<text>"` now surfaces the shortlist ahead of full fetches (`cli/src/memory_cmd.rs`).

## Semantic Search Tooling
- [x] Expose a `search_code` function tool that queries the workspace index without shelling out. (Handlers in `core/src/tools/handlers/search_code.rs`; registered alongside the existing tool registry.)
- [x] Update planner/system prompts to prefer `search_code` over spawning `/search-code` shell commands. (`core/prompt.md` now instructs agents to use `search_code`/`memory_suggest`.)
- [x] Update CLI docs to highlight the tool call (`search_code`) as the programmatic interface, with `/search-code` reserved for TUI convenience.

### Telemetry & persistence
- Record `memory_suggest` invocations (counts/timestamps) so we can measure adoption.
  - Counts are now persisted via `metrics.suggest_invocations` in `memory/metrics.json`; timestamps still TODO.
- CLI invocations of `memory_suggest` and `search_code` emit `codex.tool_result` OTEL events (see `cli/src/memory_cmd.rs` and `codex-agentic-core/src/index/commands.rs`).
- Consider storing `tool_last_suggested_at` per record (parallel to `tool_last_fetched_at`) if we want to highlight “recently suggested” rows in the TUI.

### Incremental rollout
1. Hide behind a feature toggle in settings; default to current push behaviour.
2. Once validated, remove the old injection path and make pull-based flow the default.

## Semantic Search UX Improvements
- [x] Auto-build the semantic index when a workspace has no `./.codex/index/manifest.json` (unless `index.auto_build_on_start = false`). The TUI now kicks off a background build on first launch.
- [x] Update the TUI status footer to detect missing per-workspace indexes and display an actionable hint (“Semantic index not found — building automatically…” / “run /index to build it”).
- [x] Document the per-worktree index location and symlink option in the user guide so teams understand how to share or rebuild indexes when using Git worktrees.
