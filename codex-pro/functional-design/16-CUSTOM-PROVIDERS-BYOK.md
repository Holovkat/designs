---
**Context**: Extend Codex agentic workspace with user-defined OpenAI-compatible providers (“Bring Your Own Key” / BYOK).
**Prerequisites**: Phase 5 completed (model provider switching + settings plumbing).
**Working Directory**: `codex-pro/codex-rs`
---

## 16 — Custom Providers & BYOK Modal

### What
- Allow users to register OpenAI-compatible endpoints (third-party SaaS, self-hosted proxies, local Ollama) by supplying credentials, provider kind, and optional model metadata.
- Surface a unified BYOK modal (`/BYOK`) for creating/updating provider entries, storing metadata in `settings.json` (`providers.custom`) while keeping secrets in `auth.json`.
- Give users explicit control over provider-kind specific options (e.g., Ollama `think`/post-processing toggles, Anthropic thinking budgets) and model discovery (manual “Refresh models” + cached model inspection).
- Ensure the `/model` selector and CLI resolve providers via the same runtime map, automatically disabling plan/apply/web-search/view-image tools when a provider cannot execute them.

### Participants
- Settings layer (`codex-agentic-core::settings`) – persist provider definitions, migrations, reasoning controls.
- Auth manager (`codex_core::AuthManager`) – store API tokens keyed by provider ID.
- Provider resolver (`codex-agentic-core::provider`) – normalise provider/model pairing and expose tool gating.
- TUI (`codex-rs/tui`) – BYOK modal, cached model dialog, `/model` integration.
- CLI – `models list` reflects cached results; BYOK refresh remains TUI-only in this phase.

### Desired UX
1. User invokes `/BYOK` from the TUI.
2. **Provider list** shows existing entries with actions:
   - `Add provider`
   - `Edit provider`
   - `Delete provider`
   - `Refresh models` (shortcut)
   - `View cached models`
   Metadata panel includes provider kind, base URL, cached model count, and API key status.
3. **Entry/Edit form** prompts for:
   - Provider name + ID (slug auto-derived from name, editable).
   - Provider kind (`OpenAI Responses`, `OpenAI Chat`, `Ollama`).
   - Base URL (auto-normalises `/responses`, `/chat/completions`, `/v1` depending on kind).
   - Reasoning controls (Ollama `think` + post-process toggles, Anthropic budgets).
   - Extra headers (`key=value` pairs) applied to discovery + runtime traffic.
   - Optional default model slug (used when discovery fails).
   - API key (masked input persisted to `auth.json`).
4. Saving writes metadata immediately; connectivity checks are user-driven through the “Refresh models” action:
   - Responses providers call `GET /v1/models`.
   - Ollama providers call `/api/tags` (auto-trimming `/v1`).
   - Success caches model names and timestamp; failures return inline error but keep saved settings.
5. `/model` modal groups providers by category (OpenAI defaults, Ollama, Custom) and shows the cached models. “View cached models” opens a modal with default model, cached list, last refresh time, and a refresh shortcut.
6. Switching providers/models triggers resolver updates, re-runs tool gating, and persists defaults when requested. Removing an active provider falls back to OpenAI.

### Data Model
```jsonc
{
  "model": {
    "provider": "ollama",
    "default": "qwen2.5vl:latest",
    "reasoning_effort": "medium",
    "reasoning_view": "summary"
  },
  "providers": {
    "custom": {
      "ollama": {
        "name": "Ollama (localhost)",
        "provider_kind": "ollama",
        "base_url": "http://localhost:11434",
        "wire_api": "chat",
        "default_model": "qwen2.5vl:latest",
        "added_at": "2025-10-20T18:37:12Z",
        "cached_models": [
          "qwq:latest",
          "qwen2.5vl:latest"
        ],
        "last_model_refresh": "2025-10-23T01:42:19Z",
        "reasoning_controls": {
          "think_enabled": false,
          "postprocess_reasoning": true,
          "extra": {}
        },
        "extra_headers": {}
      },
      "anthropic": {
        "name": "Anthropic Claude",
        "provider_kind": "anthropic-claude",
        "base_url": "https://api.anthropic.com/v1",
        "wire_api": "responses",
        "default_model": "claude-3-5-sonnet",
        "added_at": "2025-10-21T04:15:57Z",
        "cached_models": [
          "claude-3-5-sonnet",
          "claude-3-opus"
        ],
        "last_model_refresh": "2025-10-21T04:16:12Z",
        "reasoning_controls": {
          "think_enabled": false,
          "postprocess_reasoning": true,
          "extra": {
            "anthropic_budget_tokens": 512,
            "anthropic_budget_weight": 0.5
          }
        },
        "extra_headers": {
          "anthropic-version": "2023-06-01"
        }
      }
    }
  }
}
```

### Implementation Outline
1. **Settings + Auth**
   - `CustomProvider` now carries `provider_kind`, `reasoning_controls`, `extra_headers`, and cached model metadata.
   - Migrations convert legacy `providers.oss` into a `providers.custom.ollama` entry (no automatic reseeding afterward) and default existing custom providers to `OpenAiResponses`.
2. **Resolver + Tooling**
   - Provider resolution returns `provider_kind` and uses it to drive request plumbing (Responses vs. Chat vs. Ollama) and tool gating (`provider_kind == Ollama` disables plan/apply/web-search/view-image).
   - Non-stream fallback, telemetry, and review workflows honour provider-specific headers and reasoning outputs.
3. **BYOK UI**
   - Provider manager lists actions (Add, Edit, Delete, Refresh, View models).
   - Entry form conditionally shows reasoning fields based on provider kind.
   - Refresh action spawns async model discovery, updates cached models + timestamps, and surfaces success/failure banners.
   - Cached-model modal renders default/cached list with refresh shortcut + help text (“run `ollama pull`…”).
4. **Model Picker**
   - `/model` modal merges built-in + custom providers with grouping.
   - Selecting a provider updates session config, re-runs `sanitize_reasoning_overrides` and `sanitize_tool_overrides`, and offers to persist defaults.
5. **CLI Parity**
   - `codex-agentic models list [--provider <id>|--oss]` reads cached models; refresh remains TUI-driven in this phase.

### Verification
- `cargo test -p codex-agentic-core`
- `cargo test -p codex-tui` (insta snapshots accepted)
- Manual flows:
  - `/BYOK` add/edit/delete for OpenAI, Ollama, Anthropic entries.
  - Refresh models for each provider kind and validate cached model modal.
  - Switch models via `/model`, confirm tool gating + reasoning formatting, then persist defaults.
  - Remove active provider and confirm fallback to OpenAI.

### Provider-specific Notes
- **Ollama**: Refresh hits `<base-url>/api/tags` after normalising `/v1`. Tooling is always disabled; reasoning `<think>` blocks are post-processed when enabled.
- **Anthropic**: Provide `anthropic-version` header and optional thinking budgets. Budgets populate `reasoning_controls.extra` and inform request payloads.
- **Zhipu / Coding Plan**: `/models` returns 404; retain cached models or seed defaults manually, then refresh to verify headers.

### Follow-up Considerations
- CLI parity for `models refresh`.
- Settings/UI integration for editing `extra_headers` across multiple lines.
- Optional encryption / external secret stores for provider credentials.
- Automatic persistence of “last used” provider after successful sessions.
