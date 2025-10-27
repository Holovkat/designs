---
**Context**: consolidate OSS/BYOK model configuration, surface provider‑specific reasoning controls, and normalize how hidden “thinking” traces are handled across providers (OpenAI, Ollama, Anthropic Claude).
**Dependencies**: Phases 03, 09, 16 (settings, model providers, BYOK flow).
**Working Directory**: `codex-pro/codex-rs`
---

## 22 — Unified Provider Reasoning Handling

### Goals
- Manage all third-party providers (local Ollama, remote Z.AI, Anthropic, etc.) through a single BYOK editor experience.
- Automatically select the correct request/response plumbing based on provider type (OpenAI Responses, Ollama, Anthropic Claude).
- Expose reasoning controls (e.g., Ollama `think`, Anthropic thinking budget) alongside a Codex-side fallback that converts `<think>…</think>` blocks into structured reasoning events.
- Preserve live UI feedback while keeping the visible transcript free of raw reasoning unless explicitly enabled.

### Out of Scope
- Implementing OAuth/SSO authentication flows (tracked separately).
- Supporting providers whose APIs diverge from OpenAI/Ollama/Anthropic formats.
- Persisting encrypted refresh tokens or secret rotation policies.

### Provider Types
| Provider Kind | Canonical Endpoint | Native Reasoning Channel | Notes |
|---------------|--------------------|--------------------------|-------|
| `openai-responses` | `/v1/responses` | `reasoning_content` / `reasoning_details` | Existing default; continue to honour model-provided summaries |
| `ollama` | `/api/chat` or `/api/generate` | `message.thinking` *(when `think` enabled)* | Must send `think` flag; fallback parser needed when tags are inlined |
| `anthropic-claude` | `/v1/messages` | `thinking` content blocks / stream deltas | Requires `thinking` object in request; supports budgets (tokens, effort) |

### Phase Checklist

#### Phase 1 — Settings & Schema Foundations
- [x] Extend `codex-agentic-core/src/settings.rs` `CustomProvider` with:
  - `provider_kind: ProviderKind` (enum with `OpenAiResponses`, `Ollama`, `AnthropicClaude`).
  - `reasoning_controls` struct `{ think_enabled, postprocess_reasoning, extra }`.
- [x] Add serde migrations so existing BYOK entries default to `OpenAiResponses`.
- [x] Introduce a migration step that converts legacy `providers.oss` → `providers.custom.ollama`.
- [x] Update `core/src/config.rs` to load/store the new fields; defaults: `think_enabled=false`, `postprocess_reasoning=true` for Ollama.

#### Phase 2 — Provider Editor & Model Picker UX
- [x] Replace the legacy OSS modal with the unified BYOK editor (no longer auto-seeds an Ollama provider; users can add or import one manually).
- [x] In the BYOK form, add:
  - Provider kind dropdown.
  - Conditional inputs (Ollama: think toggle, post-process toggle; Anthropic: thinking budget numeric fields).
- [x] Ensure validation prevents mutually exclusive combinations (e.g., `think_enabled` not shown for OpenAI).
- [x] Update the model picker to consume cached models from all custom providers (remove special-cased `oss` branch) and surface per-provider refresh + cached-model views.

#### Phase 3 — Request Plumbing
- [x] Adjust the request builder (`core/src/client.rs` / `codex-agentic-core`) to branch on `provider_kind`:
  - OpenAI: unchanged.
  - Ollama: include `"think": true/false`, target `/v1/chat/completions`, and map responses to Codex events.
  - Anthropic: send `thinking` object and capture `thinking_delta`.
- [x] Ensure BYOK auth headers apply to the new Ollama provider (API key optional).
- [x] Remove uses of `model_provider_id == "oss"` across the codebase in favour of provider-kind checks.

#### Phase 4 — Reasoning Extraction Logic
- [x] Implement a streaming-safe parser that:
  - Detects `<think>…</think>` sequences.
  - Emits `ReasoningContentDelta` events for text inside tags.
  - Strips the tags from the user-visible message.
  - Handles multiple/nested blocks and partial chunks via a small state machine.
- [x] Apply the parser only when:
  - Provider kind is `Ollama` *and* `postprocess_reasoning` is true *and* the response lacks a native `thinking` field.
- [x] Mirror the same stripping in the non-stream fallback before `ResponseItem::Message` creation.
- [x] Add unit tests covering chunk boundary conditions, repeated `<think>` blocks, and mixed reasoning + normal text.

#### Phase 5 — Model Discovery & Caching
- [x] Implement an Ollama model discovery function that calls `GET /api/tags` (automatic `/v1` trimming) and stores names in `cached_models`.
- [x] Update the refresh command to handle auth (if provided) and record timestamps just like Z.AI.
- [x] Add provider-kind specific help copy in the BYOK modal (e.g., remind users to run `ollama pull`) and expose “Refresh models” / “View cached models” actions.

#### Phase 6 — QA, Docs, and Cleanup
- [x] Update relevant design docs (`09`, `16`) once implementation lands.
- [x] Document the new provider kinds, reasoning toggles, and manual refresh flow in README / quick-start material.
- [x] Add migration notes to the checklist (Phase 0 section) instructing operators how to verify converted settings.
- [x] Validate with:
  - `cargo test -p codex-agentic-core`
  - `cargo test -p codex-core` (remaining failure tracked separately: CLI resume integration)
  - `cargo test -p codex-tui`
  - Manual runs across OpenAI, Ollama, and Anthropic providers.
- [x] Remove dead code: legacy OSS settings structs, environment variables no longer needed, redundant toggles.

### Notes & Considerations
- **Migration safety**: ensure we only auto-create the Ollama custom provider when one does not already exist to avoid clobbering user-defined entries.
- **Backwards compatibility**: keep `/model --oss` and related CLI shortcuts by remapping them to the new provider ID.
- **Security**: BYOK still stores secrets in `auth.json`. No change to encryption policy for this enhancement.
- **Future work**: OAuth/SAML auth, provider-specific retry policies, richer Anthropic “thinking” controls, remote Ollama endpoints.
