---
**Context**: Extend Codex agentic workspace with user-defined OpenAI-compatible providers (“Bring Your Own Key” / BYOK).
**Prerequisites**: Phase 5 completed (model provider switching + settings plumbing).
**Working Directory**: `openai-codex`
---

## 16 — Custom Providers & BYOK Modal

### What
- Allow users to add OpenAI-compatible providers (third-party or self-hosted) by supplying an API key and base URL, with automatic detection of Chat Completions vs. Responses protocols.
- Surface a TUI modal (`/BYOK`) for creating/updating provider entries, storing metadata in `settings.json` while keeping secrets in `auth.json`.
   - Ensure the model selection modal automatically lists models from:
      1. Core/OpenAI providers,
      2. Built-in OSS (Ollama),
      3. Any BYOK providers (fetched from `/v1/models` when possible, otherwise using user-supplied model slugs or showing a placeholder entry if none are cached yet).

### Participants
- Settings layer (`codex-agentic-core::settings`) – persist provider definitions.
- Auth manager (`codex_core::AuthManager`) – store API tokens.
- Provider resolver (`codex-agentic-core::provider`) – normalise provider/model pairing.
- TUI (`codex-rs/tui`) – BYOK modal, enhanced model picker.
- CLI (optional follow-up) – potential parity commands, not in v1 scope.

### Desired UX
1. User runs `/BYOK` command within the TUI (from composer or command palette).
2. BYOK wizard flow:
   1. **Provider list step** – shows existing custom providers with actions:
      - `Add provider` (go to entry form),
      - `Edit` (pre-populated form),
      - `Delete` (with confirmation).
      Selecting a provider also reveals metadata (base URL, default model, cached model count) and indicates whether credentials are stored.
   2. **Entry/Edit form** – prompts for:
    - Provider display name (e.g., “Anthropic Claude”).
    - Provider ID (unique slug; auto-generated from name with edit capability).
    - Base URL (default `https://api.provider.com/v1`; trailing `/chat/completions` or `/responses` are trimmed and used to infer the wire protocol automatically).
    - API key (masked input, stored via auth manager).
    - Optional default model slug (used if provider cannot enumerate models).
3. On submission:
   - Store provider metadata in `settings.json.providers.custom.<id>` including base URL and flag `wire_api = "responses"` (default).
   - Persist API key in `auth.json` using existing mechanisms (similar to OpenAI tokens).
   - Attempt a connectivity check:
     * Issue a lightweight request (e.g., `GET /models`) with provided credentials.
     * If successful, cache returned models for immediate use.
     * On failure, show inline error but keep modal open for correction; user can still save and rely on manual model entry later.
4. After saving:
   - Provider appears in `/model` modal under a “Custom Providers” grouping (alongside default and OSS providers). Entries without cached models show a placeholder row that links back to `/BYOK` for refresh.
   - If `/models` response is available, list those models; otherwise show the user-specified default slug and allow manual entry.
   - No automatic provider switch; user selects the new provider in the model modal as usual.
   - If the active provider is removed, Codex automatically falls back to the built-in OpenAI connector (`gpt-5-codex`).

### Data Model
`settings.json` extension (example):
```json
{
  "providers": {
    "oss": { "endpoint": "http://localhost:11434" },
    "custom": {
      "anthropic": {
        "name": "Anthropic Claude",
        "base_url": "https://api.anthropic.com/v1",
        "wire_api": "responses",
        "default_model": "claude-3-opus",
        "added_at": "2025-10-10T22:15:00Z"
      }
    }
  }
}
```
- `providers.custom` map holds BYOK entries.
- Secrets (API keys) live in `auth.json` keyed by provider ID (reusing existing AuthManager storage). Keys can be rotated and are surfaced to the chat client even when the provider uses Chat Completions.
- Resolver updates:
  - Lookup chain: CLI overrides → persisted defaults → BYOK custom map → built-ins.
- `resolve_model_provider` treats custom providers like built-in ones (respect colon heuristics, plan-tool gating defaults to disabled unless provider flagged otherwise). CLI/TUI reloads now merge `settings.json.providers.custom` directly into the runtime `model_providers` map so `/model` and `codex exec` stay in sync.

### Implementation Outline
1. **Settings schema**
   - Update `codex-agentic-core::settings` to include optional `providers.custom` map.
   - Add helper to insert/update a custom provider.

2. **Auth Manager**
   - Extend `codex_core::AuthManager` with methods to store/retrieve tokens by custom provider ID.
   - Ensure tokens are masked/hidden in logs; reuse existing `CodexAuth` frames.

3. **Provider resolver**
   - Accept custom provider entries; treat as OpenAI-compatible unless flagged differently.
   - Disable plan tool by default for custom providers (safe baseline).
   - Provide hook for manual model list fallback (user-supplied default).
   - When deleting a provider, purge cached models and API tokens; if the deleted provider was active, revert to the default OpenAI provider/model (`gpt-5-codex` baseline).

4. **TUI BYOK modal**
   - Entry point command `/BYOK` presents wizard:
     * Step 1: List custom providers with options `Add`, `Edit`, `Delete`, `Close`.
     * Step 2: Add/Edit form with validation (non-empty name, unique ID, valid URL scheme).
   - On submit (Add/Edit):
     * Save metadata.
     * Prompt for API key (if blank, allow skip but warn interactions will fail).
     * Run async ping (configurable timeout). Show status (success, unreachable, auth failure, quota exhausted). Allow retry without closing the form.
   - On delete:
     * Confirm intent.
     * Remove provider entry from settings and associated API key from `auth.json`.
     * If the provider was active, trigger resolver to switch back to default OpenAI provider/model.
   - Deduplicate providers by ID; editing an existing provider pre-populates fields.

5. **Model selection modal**
   - Group models by provider (OpenAI, OSS, Custom) with provider labels and cached model counts.
   - For each custom provider:
     * Use cached `/models` response if available (store in memory per session).
     * If no cache, render a placeholder entry that routes the user back to `/BYOK` to seed a default model or retry discovery.
   - When user selects a custom provider model:
     * Update session config and refresh metadata via resolver. CLI runs (`codex exec`, `codex models list`) now pick up the same provider/model pairing.
     * Optionally prompt to persist as default (existing flow).

6. **CLI parity (current)**
   - Headless runs (`codex exec …`, `codex models list …`) now merge BYOK providers before issuing requests. When a custom provider is selected, the CLI resolves the stored API key and wire protocol just like the TUI.
   - Future follow-up: explicit `codex providers …` management commands.
7. **ACP parity**
   - `codex-agentic acp` merges custom providers into the runtime config before sessions start, ensuring BYOK selections (e.g., z.ai) work over stdio and avoid unsupported-model errors.
   - ACP shares the same minimal coding-plan prompt fallback used by the TUI/CLI for providers that require it.

### Validation & Testing
- Unit tests:
  - Settings serde for `providers.custom`.
  - Resolver path covering custom providers.
  - BYOK modal logic (input validation, dedup).
- Integration:
   - Snapshot tests for updated model modal grouping (`cargo test -p codex-tui` with insta acceptance).
  - `cargo check` + `cargo run --bin codex-agentic -- --help` to ensure CLI still bootstraps.
- Manual QA:
  - `/BYOK` add/edit/delete flows exercised with a live BYOK key.
- `cargo test -p codex-core` now covers the CLI stream flows end-to-end with isolated BYOK settings, including the Coding Plan regression harness that asserts fallback behaviour.
- `cargo run --bin codex-agentic -- exec --model glm-4.6 -- "hi"` sends Chat Completions payloads (`model=glm-4.6`) to `https://open.bigmodel.cn/api/coding/paas/v4/chat/completions` and automatically applies the minimal Coding Plan prompt to stay under the concurrency threshold.
- Launching `codex-agentic -m glm-4.6` (including ACP mode) auto-selects the `zai` provider before the first turn; `/status` reflects the BYOK pairing without manual `/model + /new` steps.
- Deleting a custom provider from `/BYOK` now falls back to the built-in OpenAI provider and resets the saved model to the default when no explicit override is present; verified by removing `zai` and relaunching `codex-agentic`.
  - Verified graceful handling of provider errors (401 for missing API key, 429 for exhausted balance) with user-facing stream errors.
  - Switching back to OpenAI models via `/model` resets the provider/model pairing and persists to `settings.json`.

### Provider-specific Notes
- **Zhipu AI Coding Plan endpoint**: `https://open.bigmodel.cn/api/coding/paas/v4` does not expose `/models`. When using this base URL, Codex cannot auto-enumerate models and the `/BYOK` health check will see a `404 Not Found`. Mitigation:
  - Seed `settings.json.providers.custom.<id>.cached_models` or `default_model` manually so the TUI can render model options, or keep a discovery provider pointed at the public API once to cache models.
  - The CLI/TUI now swap to the Chat Completions endpoint automatically even if `wire_api` was saved as `responses`, so Coding Plan runs do not hit 404.
  - The base instructions are overridden with a minimal Coding Plan prompt so a single turn does not burn the concurrency budget; expect the connection test to warn about missing `/models`, which is informational once models are cached.

### Follow-up Considerations
- Support custom wire APIs (Chat completions, streaming) with additional toggles.
- Allow editing/deleting providers from settings UI.
- CLI command parity.
- Encryption/pluggable key stores for API secrets beyond `auth.json`.
- Persist last-used custom provider to default automatically if desired (future).


### 0.46 BYOK Updates
- Renaming a provider now preserves the stored API key when the slug changes but the user leaves the credential untouched.
- Review mode reuses the active BYOK model slug when the default OpenAI review model would have been selected, so `/review` works against custom providers without returning 400 errors.
- CLI/TUI BYOK smoke coverage: `/review` dry runs and `codex-agentic --help` exercised the new flows on 2025-10-18.
