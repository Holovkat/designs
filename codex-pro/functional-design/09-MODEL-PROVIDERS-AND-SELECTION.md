---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 09 — Model Providers & Selection (Ollama / OSS)

What
- Add support for the OSS provider (Ollama) alongside the default provider, with the ability to discover installed models, select a default model, and switch models at runtime from both CLI and TUI.

Where
- Settings: `settings.json` (model/provider fields below)
- Shared lib: `codex-rs/codex-core` (provider client wiring) 
- CLI: `models list` verb and `--model`/`--oss` options
- TUI: model selector UI, events to update/persist

How
1) Settings schema (extend 03-SETTINGS-AND-CONFIG)
```json
{
  "model": {
    "provider": "oss",              // "oss" for Ollama, or other provider ID
    "default": "qwq:latest",        // default model name to use
    "reasoning_effort": "medium",   // optional
    "reasoning_view": "summary"     // optional
  },
  "providers": {
    "oss": {
      "endpoint": "http://localhost:11434"  // Ollama base URL
    }
  }
}
```

2) Provider resolution (`codex-rs/codex-agentic-core/src/provider/mod.rs`)
- Shared resolver returns a `ModelProviderResolution` capturing the effective model slug, provider override, OSS state, and whether the plan tool remains enabled.
- Delivered implementation:
  - `resolve_model_provider(...)` ingests CLI overrides and settings defaults, forcing the OSS provider whenever `--oss` is supplied or the slug contains `:`, and snapping colon-free slugs back to the OpenAI provider even if settings previously stored `oss`.
  - Guarantees `--oss` always yields both the built-in `oss` provider ID and `DEFAULT_OSS_MODEL`, restoring the Ollama model list in the TUI even if the prior default was an OpenAI slug.
  - Exposes `plan_tool_supported(provider_id, model)` so CLI, TUI, and exec consistently disable the plan tool for OSS models (with a guard for `qwen2.5vl`).
  - Centralises `oss_active` checks so `ensure_oss_ready` only runs when the resolver places the session in OSS mode.

3) CLI behavior
- `models list [--oss]` prints available models for the configured provider (or `--oss` to force Ollama).
- The launcher reads `settings.json` to determine default provider and model when not overridden.

4) TUI behavior
- Provide a model selector menu that queries `list_models()` and allows selection of the active model.
- Dispatch events already used by the app layer to update state:
  - Update model: set active model for the session.
  - Persist selection: write the chosen model into `settings.json.model.default`.
- Ensure the displayed model/provider reflect the current session settings.

Why
- Keeps model choice clear and consistent across CLI and TUI.
- Allows using local models (Ollama) when desired.

When
- On startup to pick the default model.
- Any time the user changes model via CLI or TUI.

Verification
- `codex-agentic models list --oss` shows models from Ollama at `providers.oss.endpoint`.
- Starting `codex-agentic --model qwq:latest` sets the active model for that session.
- In the TUI, changing the model updates the session; choosing "persist" writes the new default to `settings.json`.

Provider Resolver (final)
- file_path: `codex-rs/codex-agentic-core/src/provider/mod.rs`
- key API:
```rust
pub struct ModelProviderResolution {
    pub model: Option<String>,
    pub provider_override: Option<String>,
    pub oss_active: bool,
    pub include_plan_tool: bool,
}

pub fn resolve_model_provider(args: ResolveModelProviderArgs<'_>) -> ModelProviderResolution
```
- Highlights:
  - Normalises provider/model pairing for TUI, CLI, exec, and MCP.
  - Always prefers `DEFAULT_OSS_MODEL` when switching into OSS mode without an explicit slug.
  - Leaves colon-free slugs on the OpenAI provider, eliminating mismatched provider/model pairs.
  - `plan_tool_supported(...)` feeds directly into the overrides used by `tui` and `exec`.

Find / Insert Map (grounded in current code)
- codex-rs/cli/src/main.rs
  - Find: `Subcommand::Models` and related handling
  - Behavior today: supports `--oss` and calls an Ollama client to fetch models; mirror this via your provider resolver reading settings.
- codex-rs/tui/src/lib.rs 
  - Events: Look for existing model update events (AppEvent::UpdateModel, etc.)
  - Wire model selector to call these and persist into `settings.json.model.default`.

Acceptance Criteria
| Item | Must be true |
|---|---|
| Provider | Setting `model.provider=oss` uses Ollama endpoint from settings |
| Listing | `models list` prints OSS models when provider is oss or `--oss` given |
| Selection | Changing model in TUI updates session; persisting writes settings |

Verification (2025-10-10)
- `cargo test -p codex-agentic-core`
- `RUST_TEST_THREADS=1 cargo test -p codex-tui -- --test-threads=1`
- `cargo test -p codex-exec`
- `just fix -p codex-tui`
- `just fix -p codex-exec`
- `just fmt`
