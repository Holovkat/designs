---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 03 — Settings and Config (settings.json)

Outcome
- One JSON file controls all runtime behavior.

Schema (keys and purpose)
```json
{
  "updates": { "repo": "owner/repo", "latest_url": null, "upgrade_cmd": null, "disable_check": false },
  "index": {
    "overlay": true,
    "refresh_min_secs": 300,
    "post_turn_refresh": true,
    "retrieval_enabled": true,
    "retrieval_threshold": 0.65,
    "context_tokens": 800
  },
  "acp": { "yolo_with_search": false },
  "prompts": { "default": ".codex/.custom-system-prompts" }
}
```

### Managed configuration overlays (upstream 0.45.0+)

Upstream added a multi-layer configuration pipeline that we now inherit. Runtime configuration is produced by merging, in order (lowest → highest precedence):

1. `config.toml` in `~/.codex/` (or `$CODEX_HOME/config.toml` when set).
2. `managed_config.toml`
   - On macOS & Linux this defaults to `/etc/codex/managed_config.toml`.
   - On Windows it falls back to `$CODEX_HOME/managed_config.toml`.
   - IT can override the path with the hidden loader flag `--managed-config-path` (used in tests).
3. Managed preferences (macOS only), delivered via device profiles as a Base64-encoded TOML blob.

The loader merges these layers in-place (see `core/src/config_loader/mod.rs`). The highest layer wins per field; we do not attempt to merge arrays. Our agentic additions must therefore:

- Continue writing user-specific overrides to `config.toml`.
- Treat `managed_config.toml` and managed preferences as read-only overlays. We never persist back into them.
- Surface any managed-only keys (e.g., `mcp_oauth_credentials_store`, BYOK provider defaults) alongside our `settings.json` driven behaviour so that administrators can lock configuration without breaking agentic features.

Steps
0) Copy `future-functional-design/example-system-prompts/` into `openai-codex/example-system-prompts/` so the shared samples travel with the workspace (see the README inside that folder).
1) Create `codex-rs/codex-agentic-core/src/settings.rs` with typed structs and `load()` that reads `./settings.json` (this crate is the shared home for settings, prompt overlay, and command registry helpers).
2) Add `settings.json` to repo root; commit.
3) Pass parsed settings into: updates, index (post-turn policy), CLI/Exec/TUI boot, and the prompt overlay loader (see Phase 04 notes). When `prompts.default` resolves to a directory (default `.codex/.custom-system-prompts`), every readable `*.md` file is concatenated in lexical order; duplicate sections are automatically deduped and missing directories/files fall back silently to the embedded defaults.

Legacy toggle name → settings key
- CODEX_INDEX_OVERLAY → index.overlay
- CODEX_INDEX_REFRESH_MIN_SECS → index.refresh_min_secs
- CODEX_DISABLE_POST_TURN_INDEX_REFRESH → index.post_turn_refresh (false to disable)
- CODEX_INDEX_RETRIEVAL → index.retrieval_enabled
- CODEX_INDEX_RETRIEVAL_THRESHOLD → index.retrieval_threshold
- CODEX_INDEX_CONTEXT_TOKENS → index.context_tokens
- CODEX_AGENTIC_UPDATE_REPO / CODEX_UPDATE_LATEST_URL / CODEX_UPGRADE_URL / CODEX_AGENTIC_UPGRADE_CMD / CODEX_CURRENT_VERSION → updates.repo / updates.latest_url / updates.upgrade_cmd / current version is read from the crate metadata, not a key

Verification
- `jq '.' settings.json` passes.
- App boots with defaults when keys are missing.
- Managed overlays: with only `managed_config.toml` present, values override `config.toml`; on macOS managed preferences delivered via device profile supersede both.

Find / Insert Map (grounded in current code)
- codex-rs/cli/src/main.rs
  - Find: `fn cli_main` (async function that handles the main CLI logic)
  - Insert: load settings once, pass to launcher subsystems.
- codex-rs/tui/src/chatwidget.rs
  - Find: `fn maybe_trigger_post_turn_index_refresh(&mut self)` (search for this function)
  - Replace reads of backoff/disable with values from settings.
- codex-rs/tui/src/app.rs
  - Find: handlers for `AppEvent::Indexing*` (search for IndexingStarted, IndexingProgress, IndexingCompleted)
  - Use `settings.index.overlay` to decide overlay behavior.

Code Snippet — settings loader (shared crate)
```rust
// codex-rs/codex-agentic-core/src/settings.rs
#[derive(serde::Deserialize, Default, Clone)]
pub struct Settings { pub updates: Option<Updates>, pub index: Option<Index>, pub acp: Option<Acp>, pub model: Option<Model>, pub providers: Option<Providers>, pub prompts: Option<Prompts> }
#[derive(serde::Deserialize, Default, Clone)]
pub struct Updates { pub repo: Option<String>, pub latest_url: Option<String>, pub upgrade_cmd: Option<String>, pub disable_check: Option<bool> }
#[derive(serde::Deserialize, Default, Clone)]
pub struct Index { pub overlay: Option<bool>, pub refresh_min_secs: Option<i64>, pub post_turn_refresh: Option<bool> }
#[derive(serde::Deserialize, Default, Clone)]
pub struct Acp { pub yolo_with_search: Option<bool> }
#[derive(serde::Deserialize, Default, Clone)]
pub struct Model { pub provider: Option<String>, pub default: Option<String>, pub reasoning_effort: Option<String>, pub reasoning_view: Option<String> }
#[derive(serde::Deserialize, Default, Clone)]
pub struct Providers { pub oss: Option<Oss> }
#[derive(serde::Deserialize, Default, Clone)]
pub struct Oss { pub endpoint: Option<String> }
#[derive(serde::Deserialize, Default, Clone)]
pub struct Prompts { pub default: Option<String> }
pub fn load() -> Settings { std::fs::read_to_string("settings.json").ok().and_then(|s| serde_json::from_str(&s).ok()).unwrap_or_default() }
pub fn init_global(settings: Settings) -> Settings { /* cache + return */ }
pub fn global() -> Settings { /* read cached or load */ }
```

Acceptance Criteria
| Item | Must be true |
|---|---|
| File presence | `settings.json` exists; loader compiles |
| Wiring | Launcher reads settings and no longer relies on inline constants for these behaviors |
| TUI | Post-turn refresh and overlay behavior follow settings values |
| Prompt overlay | Settings-fed prompt directory resolves, only `*.md` files are concatenated (others ignored), and overlay text merges into config/user instructions (empty overlays skipped) |

Replace Protocol (use these exact blocks)

Replace #1 — Integrate settings loading in CLI main
- file_path: codex-rs/cli/src/main.rs
- old_string: (locate the main function where configuration is loaded)
- new_string: 
```rust
// Load settings once and derive configuration
let settings = codex_core::settings::load();
// Use settings in place of environment variables where applicable
```
