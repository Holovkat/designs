# Implementation Checklist – Qwen Code Custom Provider Bridge (Phase 1)

## Scope
Create a reusable bridge layer that lets our z.ai GLM CodePlan + GPT‑5 Codex integrations plug into Qwen Code without modifying upstream core packages.

## Checklist
1. **Bridge Workspace Created (Applies to Enhancements 11 & 12)**
   - [x] New package folder (e.g., `bridges/qwen-custom/`) with its own `package.json`, build script, and TS config.
   - [x] Exports a minimal API: `registerProviders(config)` and `registerCommands(cli)`.
   - Refer to **Architecture Overview** (`features/01-ARCHITECTURE-OVERVIEW.md`) and **Folder Layout** (`features/02-FOLDER-LAYOUT.md`) for structure.
2. **Provider Adapter Interfaces (Shared Foundation)**
   - [x] Define TypeScript interfaces that extend `OpenAICompatibleProvider` contracts without editing `packages/core`.
   - [x] Include shims for token limits, telemetry metadata, and request decorators.
   - See **API Integration** (`features/07-API-INTEGRATION.md`) for contract expectations.
3. **Enhancement 11 – z.ai GLM CodePlan**
   - [x] Implements endpoint detection (`provider_id_is_zai`) and CodePlan request pipeline.
   - [x] Injected via bridge entrypoint that hooks into Qwen Code at runtime (e.g., dynamic import inside `scripts/start.js`).
   - Follow **Enhancement 11 doc** (`features/11-ZAI-GLM-ENHANCEMENT.md`) for full scope.
4. **Enhancement 12 – GPT‑5 Codex Integration**
   - [ ] Adds normalization + token-limit overrides through bridge middleware (monkey patches only through exported setter hooks).
   - [ ] Provides helper for reasoning effort defaults mirroring Codex CLI.
   - Follow **Enhancement 12 doc** (`features/12-GPT5-CODEX-ENHANCEMENT.md`) for detailed steps.
5. **Config Surface (Shared)**
   - [ ] Documents new `.qwen/settings.json` keys under `features/03-SETTINGS-AND-CONFIG.md`.
   - [ ] CLI detects missing secrets and guides users to run `/auth custom`.
6. **Testing**
   - [ ] Unit tests for provider detection + request shaping.
   - [ ] Integration test that runs `/codeplan` using mocked GLM endpoints.
   - Testing guidance lives in `features/98-TESTING-AND-VERIFICATION.md`.
7. **Docs**
   - [ ] Keep `features/glm-codeplan-gpt5-support-tfd.md` aligned with bridge plan.
   - [ ] Update README/addendum once bridge is ready.
8. **Enhancement 13 – BYOK Custom Provider Management**
   - [ ] Add `/BYOK` command docs and UX flow for listing/editing custom providers.
   - [ ] Describe persistence, cached model refresh, and provider delete behavior in docs.
   - [ ] Document telemetry + connectivity hints for the BYOK tooling.
