---
**Context**: This document describes changes to be applied ON TOP of the OpenAI Codex repository.
**Prerequisites**: Phase -1 complete (repo cloned and verified to build)
**Working Directory**: Root of the OpenAI Codex clone
---

## 09 — Model Providers & Selection

What
- Treat every provider (built-in OpenAI, local Ollama, remote BYOK connectors) as a first-class entry surfaced through a single resolver and model picker. Allow users to fetch cached model lists per provider, refresh them manually, and switch models at runtime from both CLI and TUI—no dedicated launch flags required. Ensure provider-specific tool capabilities (plan/apply-patch/web-search/view-image) auto-disable when the active provider cannot serve them.

Where
- Settings: `settings.json` (model/provider fields below)
- Shared lib: `codex-rs/codex-core` (provider client wiring) 
- CLI: `models list` verb and `--model`/`--oss` options
- TUI: model selector UI, events to update/persist (also re-syncs tool capability flags when switching providers/models)

How
1) Settings schema (extend 03-SETTINGS-AND-CONFIG)
```json
{
  "model": {
    "provider": "ollama",           // provider ID selected in BYOK (/model)
    "default": "qwq:latest",        // default model name to use
    "reasoning_effort": "medium",   // optional
    "reasoning_view": "summary"     // optional
  },
  "providers": {
    "custom": {
      "ollama": {
        "name": "Ollama (localhost)",
        "provider_kind": "ollama",
        "base_url": "http://localhost:11434",
        "wire_api": "chat",
        "postprocess_reasoning": true,
        "think_enabled": false,
        "cached_models": ["qwq:latest"],
        "last_model_refresh": "2025-10-18T19:42:11Z"
      }
    }
  }
}
```

2) Provider resolution (`codex-rs/codex-agentic-core/src/provider/mod.rs`)
- Shared resolver returns a `ModelProviderResolution` capturing the effective model slug, provider override, provider kind, and whether the plan tool remains enabled.
- Delivered implementation:
  - `resolve_model_provider(...)` ingests CLI overrides and settings defaults, using provider-kinds instead of hard-coded IDs to decide whether to switch transports or disable tooling.
  - Colon-free slugs continue to snap back to OpenAI; namespace-qualified slugs follow the provider stored in settings (custom providers, Ollama, etc.).
  - Exposes `plan_tool_supported(provider_id, model)` so CLI, TUI, ACP, and exec consistently disable plan/apply-patch/web-search/view-image for any provider/model that lacks tool support (e.g., Ollama models or Z.AI coding endpoints). Ollama providers now automatically gate tools regardless of model slug.
  - Eliminates `oss_active` sprinkling; downstream checks consult `provider_kind == Ollama`.

3) CLI behavior
- `models list` prints cached models for the configured provider; `--oss` remains a convenience flag that temporarily forces the Ollama provider.
- The launcher reads `settings.json` to determine default provider/model when not overridden and respects provider-level tool gating. Model caches are updated via the BYOK modal or a future CLI parity command (out-of-scope here).
- Chat-mode BYOK providers reuse stored API keys when dispatching requests, keeping `/BYOK` as the single place credentials are managed (extra headers remain additive).
- CLI overrides forward both `model` and `provider_id` through `OverrideTurnContext`, so follow-up turns reuse the newly selected provider without re-launching Codex.

4) TUI behavior
- Provide a model selector menu that queries cached models per provider, exposes a “Refresh models” action, and presents a “View cached models” modal that lists the provider’s default, cached entries, and refresh help text.
- Dispatch events already used by the app layer to update state:
  - Update model: set active model for the session.
  - Persist selection: write the chosen model into `settings.json.model.default`.
- Ensure the displayed model/provider reflect the current session settings.
- Switching to an Ollama or custom BYOK model from the modal automatically flips the provider, re-runs tool gating, and prompts users to refresh models manually—no `/model --oss`, manual provider edit, or `/new` restart required mid-session.

Why
- Keeps model choice clear and consistent across CLI and TUI.
- Allows using local models (Ollama) and remote BYOK connectors with provider-specific reasoning/tool behavior.

When
- On startup to pick the default model.
- Any time the user changes model via CLI or TUI.

Verification
- `codex-agentic models list --provider ollama` shows cached models after refreshing via `/BYOK` → “Refresh models”.
- Starting `codex-agentic --model qwq:latest` sets the active model for that session and disables tool calls (Ollama provider).
- In the TUI, changing the model updates the session; choosing "persist" writes the new default to `settings.json`. The “View cached models” action shows last refresh time and default fallback.
- Selecting an Ollama model from the modal (without `--oss`) switches the provider, clears incompatible tools, and reprompts users to refresh if no cached models exist.
- Switching models mid-conversation now updates the active provider in-place; send a follow-up prompt without `/new` to confirm the new model answers in the existing thread.

Provider Resolver (final)
- file_path: `codex-rs/codex-agentic-core/src/provider/mod.rs`
- key API:
```rust
pub struct ModelProviderResolution {
    pub model: Option<String>,
    pub provider_override: Option<String>,
    pub provider_kind: ProviderKind,
    pub include_plan_tool: bool,
}

pub fn resolve_model_provider(args: ResolveModelProviderArgs<'_>) -> ModelProviderResolution
```
- Highlights:
  - Normalises provider/model pairing for TUI, CLI, exec, and MCP.
- Always prefers `DEFAULT_OSS_MODEL` when switching into Ollama without an explicit slug (manual creation now happens via `/BYOK`).
- Leaves colon-free slugs on the OpenAI provider, eliminating mismatched provider/model pairs.
- `plan_tool_supported(...)` feeds directly into the overrides used by `tui` and `exec`.
- `sanitize_tool_overrides(...)` now re-runs after every model/provider change, disabling plan/apply-patch/web-search/view-image (and their feature flags) whenever the resolved provider lacks tool support—covering both Z.AI chat endpoints and Ollama models (provider-kind check).

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
