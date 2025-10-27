# Continuation: Unified Provider Reasoning Handling — Handoff Prompt

You are onboarding to implement “22 — Unified Provider Reasoning Handling” in codex-rs.

**Goals**
1. Move Ollama into the BYOK provider editor so all providers share a single configuration surface.
2. Add a provider-kind dropdown (OpenAI Responses, Ollama, Anthropic Claude) and show provider-specific reasoning controls (e.g., Ollama `think`, post-process toggle).
3. Update request builders/streams to honour those controls:
   - Send the provider’s native thinking flag when available.
   - If an Ollama response still includes `<think>…</think>`, strip it with a streaming-safe parser and emit reasoning events instead.
4. Refresh model discovery so Ollama models populate the same cached list as other providers.
5. Remove the legacy `oss` provider special cases, migrate existing settings, and update documentation/tests accordingly.

**Key References**
- designs/codex-pro/functional-design/09-MODEL-PROVIDERS-AND-SELECTION.md
- designs/codex-pro/functional-design/16-CUSTOM-PROVIDERS-BYOK.md
- designs/codex-pro/functional-design/22-UNIFIED-PROVIDER-REASONING-HANDLING.md

**Deliverables**
- Updated settings schema + migrations.
- Unified BYOK editor & model picker UX.
- Request/stream handling for the three provider kinds.
- Reasoning parser with tests.
- Model refresh support for Ollama.
- Documentation updates and validation notes.

Follow the phase checklist in doc #22 and keep the implementation aligned with existing style guides (see root AGENTS.md). Reach out only if a requirement conflicts with other design docs.
