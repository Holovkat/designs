# Enhancement 12 – OpenAI GPT‑5 Codex Bridge

## Objective
Expose GPT‑5 Codex (and GPT‑5.1 variants) as first-class providers in Qwen Code via the external bridge, including reasoning controls and fallback behavior.

## Deliverables
1. **Provider Adapter**
   - `gpt5Provider.ts` composes the upstream default OpenAI provider but injects:
     - Model normalization for `gpt-5`, `gpt-5.1`, `gpt-5-codex`, and `openai/gpt-5-codex`.
     - Token limit overrides (input 2M, output 8K default).
     - Reasoning payload support using OpenAI Responses API (`reasoning: { effort }`).
   - Adds telemetry tags `providerId=openai-gpt5` and `reasoningEffort`.
    - Implementation now lives under `bridges/qwen-custom/src/providers/gpt5Provider.ts`, registers via the bridge registry, and the CLI/parser wires `--reasoning-effort` + `generationConfig.reasoningEffort` (`packages/cli/src/config/config.ts`, `packages/cli/src/config/settingsSchema.ts`, `packages/core/src/core/contentGenerator.ts`).

2. **Config & Defaults**
   - Settings overlay adds:
     ```jsonc
     "customProviders": {
       "gpt5codex": {
         "baseUrl": "https://api.openai.com/v1",
         "model": "gpt-5-codex",
         "reasoningEffort": "medium"
       }
     }
     ```
   - CLI fallback order: `gpt-5-codex` → `qwen3-coder-plus` → others.
   - Provide startup hint if GPT‑5 is selected but API key missing.

3. **Reasoning Controls**
   - Bridge registers CLI flag `--reasoning-effort <low|medium|high>` and stores preference in session config.
   - UI indicator in status bar when reasoning is active (matching Codex CLI behavior).

4. **Workflow Integration**
   - Ensure `/codeplan` can optionally switch execution model to GPT‑5 Codex if GLM plan prefers it.
   - Provide one-shot command helpers (e.g., `qwen --provider=gpt5codex "refactor file"`) that set reasoning defaults automatically.

5. **Testing**
   - Unit: normalization, token limits, reasoning payload builder.
   - Integration: mocked Responses API verifying reasoning toggles, fallback handling, telemetry output.
   - Regression: ensure GPT‑5 provider doesn’t affect DashScope/Qwen defaults when not selected.

6. **Documentation**
   - Update README + AGENTS with GPT‑5 instructions (API scopes, rate limits, usage examples).
   - Extend `features/03-SETTINGS-AND-CONFIG.md` and `07-API-INTEGRATION.md` with GPT‑5 specifics.

## Step-by-Step Plan
1. Implement `gpt5Provider.ts` and register via bridge registry.
2. Add reasoning helpers (`reasoningDefaults.ts`) that map CLI flag / config to API payload.
3. Patch startup loader to expose new provider option in `/model` dialog.
4. Update token normalization shim within bridge (without editing upstream `tokenLimits.ts`).
5. Write comprehensive tests (unit + integration).
6. Document setup (keys, reasoning flags) and add change-log entry.
7. Validate manually with real GPT‑5 API key; capture sample telemetry for troubleshooting.
