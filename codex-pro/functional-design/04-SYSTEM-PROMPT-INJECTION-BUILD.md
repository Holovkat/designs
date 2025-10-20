---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 04 — System Prompt (Directory-Based overlays in `.codex/.custom-system-prompts`)

Outcome
- Use a directory of Markdown overlays stored under `.codex/.custom-system-prompts/` and load them at runtime via `settings.json.prompts.default`. Currently, both CLI and future ACP paths will use the same aggregated content.

Steps
0) Copy the curated starter overlays from `future-functional-design/example-system-prompts/` into `openai-codex/example-system-prompts/`, then (optionally) copy the `.md` files into `.codex/.custom-system-prompts/`. The README inside `example-system-prompts/` describes this workflow.
1) Provision `.codex/.custom-system-prompts/` (directory lives under the repo's `.codex` home). All `*.md` files inside this folder form the overlay (non-`.md` files or names such as `foo.md.disabled` are ignored). The default settings entry now points at this directory.
2) Implement / reuse the loader in `codex-rs/codex-agentic-core/src/prompt.rs` so it resolves the `.codex/.custom-system-prompts` directory, sorts all readable `*.md` files lexicographically, concatenates their contents, and caches both the overlay string and the contributing file list. If the directory or eligible files are missing, fall back quietly.
3) At startup, combine the overlay with Codex Core's built-in `BASE_INSTRUCTIONS` before handing off to the CLI, Exec, and TUI frontends. The helper `default_base_prompt()` returns the upstream base instructions and `apply_overlay_to_config()` merges the overlay into `Config.user_instructions` while leaving `ConfigOverrides.base_instructions` pointed at the upstream base string.
4) Replace hardcoded prompts with calls through `init_global_prompt()` / `global_prompt()` so every surface sees the concatenated overlay (the `/status` command reflects the filenames via the cached source list). Settings still allow overriding the directory path (absolute or relative) if needed.

Verification
- Modifying the prompt file changes assistant behavior on next run without a rebuild.

Find / Insert Map
- codex-rs/codex-agentic-core/src/prompt.rs
  - Implement helpers that resolve the configured directory, collect `*.md` files, concatenate them, and cache both the overlay string and the list of source files (falling back to no overlay when empty).
- codex-rs/cli/src/main.rs and codex-rs/tui/src/lib.rs
  - Find: Agent initialization and prompt wiring
  - Insert: initialize shared prompts via `init_global_prompt(&settings)` and feed base + overlay (overlay also drives `/status`).

Acceptance Criteria
| Item | Must be true |
|---|---|
| Prompt read | Dropping or editing `*.md` files under `.codex/.custom-system-prompts/` affects the next run |
| Base + overlay | Base instructions always come from upstream `codex-core` while the concatenated overlay (all matching `.md` files) is appended via user instructions |
| Single source | CLI, Exec, TUI, and future ACP reuse the same overlay text from `codex-agentic-core::global_prompt()` |
| Safe fallback | Missing `.codex` or `.custom-system-prompts` quietly results in no overlay (base instructions still apply) |
| Deduped output | Identical overlay sections are merged once even if multiple files contain the same content |
| Status view | `/status` output lists each overlay `.md` filename (one per line) currently loaded |
