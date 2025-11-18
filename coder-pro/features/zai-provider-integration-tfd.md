# Frontend Technical Functional Requirements Document (TFD)

## Document Metadata
- **Project Name**: coder-pro – z.ai Provider Integration
- **PRD Reference**: Internal request "GLM (z.ai) provider parity with codex-pro" (2025-11-17)
- **Version**: 0.2.0
- **Last Updated**: 2025-11-19
- **Author**: Codex (GPT-5)
- **Target Completion**: 2025-12-01

---

## 1. Executive Summary

### 1.1 Project Overview
The new coder-pro workflow lets users configure any OpenAI-compatible provider (z.ai/GLM, OpenAI, DeepSeek, etc.) directly from `/auth`, persist the selection, fetch its `/models`, toggle provider-specific “thinking/reasoning” modes, and switch models from `/model`. Everything lives in coder-pro–scoped modules under `packages/cli/src/coder-pro/**`, so upstream merges can opt in explicitly. Runtime wiring updates `Config`/OpenAI pipelines with each provider’s base URL, headers, API key, thinking parameter, and context window, enabling correct payloads and accurate “context left” telemetry.

### 1.2 Technical Stack
- **Framework**: React 18 + Ink 4 (CLI TUI)
- **State Management**: React Context (UIState/UIActions/Config) + custom hooks (`useAuth`, `useDialogClose`)
- **Styling**: Ink primitives with shared color tokens (`packages/cli/src/ui/colors.ts`, `semantic-colors.ts`)
- **Routing**: DialogManager orchestrating modal stack (no URL routing)
- **Build Tool**: ts-node/tsx for dev, esbuild bundling via `scripts/build.js`
- **Type Safety**: TypeScript across `packages/cli` + `packages/core`

### 1.3 Implementation Phases (Delivered)
1. **Provider Persistence Layer** – `packages/cli/src/coder-pro/providers/{ProviderStore,ProviderTemplates,ProviderTypes}.ts` extend settings to store `providers.selected`, `providers.custom`, cached model lists, thinking metadata, extra headers, API keys, and context windows.
2. **CoderPro Auth Dialog** – `packages/cli/src/coder-pro/dialogs/CoderProAuthDialog.tsx` + `CoderProProviderWizard.tsx` replace `/auth` when `isCoderProProviderBridgeEnabled()` (see `packages/cli/src/coder-pro/utils/bridgeFlag.ts`). The wizard handles templates, extra headers, API key masking, Ctrl/⌘+T connection testing, delete/add shortcuts, and persistence to ProviderStore.
3. **Runtime Credential Bridge** – `packages/cli/src/ui/AppContainer.tsx` now calls `config.updateCredentials` with provider base URL, headers, model, and thinking options whenever a provider is saved/selected/deleted. Core `Config`/OpenAI pipeline (`packages/core/src/config/config.ts`, `contentGenerator.ts`, `openaiContentGenerator/pipeline.ts`, `provider/default.ts`) accept `extraHeaders` + `thinking` payload metadata and inject reasoning parameters for OpenAI and z.ai.
4. **Model Cache Service** – `packages/cli/src/coder-pro/providers/ProviderModelFetcher.ts` + `ProviderConnectionTester.ts` fetch `/models` and validate connectivity. Results are cached via `updateProviderModels` and surfaced in UI state/history logs.
5. **CoderPro Model Dialog** – `packages/cli/src/coder-pro/dialogs/CoderProModelDialog.tsx` replaces `/model` when a provider is selected. Users can refresh models (R), cycle thinking modes (T), and pick a model. Context usage now reflects provider-specific limits and cached tokens (`packages/cli/src/ui/components/ContextUsageDisplay.tsx`, `Footer.tsx`).
6. **QA & Docs** – New Vitest suites (`packages/cli/src/coder-pro/dialogs/CoderProProviderWizard.test.tsx`, `packages/cli/src/ui/commands/modelCommand.test.ts`) plus `AGENTS.md` entries describe bridge points. This TFD captures file-level references for future maintainers.

---

## 2. Atomic Design System Architecture

### 2.1 Atomic Design Principles
```
Atoms (Ink Text/Input) → Molecules (RadioButtonSelect, KeyPrompt fields) →
Organisms (Auth dialog, Model dialog) → Templates (DialogManager states) →
Pages (CLI session surface)
```

### 2.2 Component Hierarchy Structure (as implemented)
```
packages/cli/src/
├── coder-pro/
│   ├── dialogs/
│   │   ├── CoderProAuthDialog.tsx            # wraps RadioButtonSelect + wizard entry
│   │   ├── CoderProProviderWizard.tsx        # selection + multi-step form controller
│   │   ├── CoderProProviderSelection.tsx     # template list (P/A/D shortcuts)
│   │   ├── CoderProProviderForm.tsx          # form w/ FieldInput atoms + Ctrl/⌘+T test
│   │   └── CoderProModelDialog.tsx           # model picker w/ refresh + thinking toggle
│   ├── providers/
│   │   ├── ProviderTypes.ts                  # ProviderEntry: headers, thinking, context
│   │   ├── ProviderTemplates.ts              # seeded templates (OpenAI, z.ai)
│   │   ├── ProviderStore.ts                  # CRUD vs LoadedSettings
│   │   ├── ProviderConnectionTester.ts       # pings `/models`
│   │   ├── ProviderModelFetcher.ts           # fetches & caches `/models`
│   │   └── ProviderUtils.ts                  # header/thinking parsers
│   └── utils/
│       └── bridgeFlag.ts                     # guards coder-pro dialogs in DialogManager
├── ui/components/shared/FieldInput.tsx       # new atom reused by forms
├── ui/components/DialogManager.tsx           # swaps auth/model dialogs based on provider
├── ui/AppContainer.tsx                       # wires UIActions to provider handlers
├── ui/commands/modelCommand.ts               # opens coder-pro dialog when provider selected
└── config/settingsSchema.ts                  # persists `providers.*` + security info
```
Upstream files remain untouched outside of the explicit bridges in `DialogManager.tsx`, `AppContainer.tsx`, and the core config/pipeline updates described below.

---

## 3. Component Specifications

| Component / File | Type | Responsibilities | Key Inputs | Outputs / Side-effects |
|------------------|------|------------------|-----------|------------------------|
| `packages/cli/src/coder-pro/dialogs/CoderProAuthDialog.tsx` | Organism | Fork of `/auth` that swaps in provider wizard, handles ESC + numeric shortcuts, keeps Qwen OAuth path intact. | `settings`, UI actions (`handleAuthSelect`, `handleProviderConfigured`, etc.). | Opens wizard, propagates selected auth type, shows errors inline. |
| `CoderProProviderWizard.tsx` | Template | Controls selection vs. form steps, loads templates, hydrates saved provider, handles P/A/D shortcuts, runs connection tests. | Provider templates, `LoadedSettings`, callbacks for submit/active-provider/default reset. | Calls ProviderStore, sets selected provider, logs refresh/test status. |
| `CoderProProviderForm.tsx` + `ui/components/shared/FieldInput.tsx` | Organism + Atom | Multi-field form with masked API key, extra headers, thinking metadata, context window. Ctrl/⌘+T triggers `ProviderConnectionTester`. | Current `ProviderFormValues`, `onTest`, `onSubmit`, failure prompt state. | Emits validated values, displays failure prompt (S/E/D hotkeys), feeds ProviderStore. |
| `CoderProProviderSelection.tsx` | Molecule | Renders provider template list with highlight + instructions, handles `p` (mark active), `a` (clone template), `d` (delete), `Esc` exit. | Template definitions, `activeProviderId`. | Emits selection + mark-active events, ensuring wizard state stays consistent. |
| `CoderProModelDialog.tsx` | Organism | Replaces `/model` dialog when a provider is active. Shows cached models, marks active model with `*`, lets users refresh (`R`) or cycle thinking values (`T`). | Provider metadata, cached models, current model from Config. | Calls `config.setModel`, `settings.setValue('model.name', ...)`, `uiActions.handleProviderThinkingChange`. |
| `ProviderStore.ts` / `ProviderTemplates.ts` / `ProviderTypes.ts` | Service | Typed persistence helpers for `settings.providers`, `security.auth.providers`, cached models, thinking values, context windows. | `LoadedSettings`, `SettingScope`, `ProviderEntry`. | Mutate settings via `setValue`, merge entries, expose getters for selection/cached data. |
| `ProviderConnectionTester.ts` / `ProviderModelFetcher.ts` | Service | Issue GET requests to `<baseUrl>/models` with proper headers to validate connectivity and cache models. | Provider config (base URL, API key, extra headers). | Return structured results, call `updateProviderModels`, surface history entries. |
| `DialogManager.tsx` + `AppContainer.tsx` + `UIActionsContext.tsx` | Template glue | Swap coder-pro dialogs into the stack, wire refresh/testing handlers, sync provider metadata into UI actions/state. | `settings`, `config`, computed UI state. | Maintains provider-specific runtime state, updates history log messages, ensures `handleRefreshProviderModels` works from dialogs. |
| `ContextUsageDisplay.tsx` + `Footer.tsx` | Atom + Organism | Computes context percentage from provider-specific limit and cached tokens; surfaces `(xx% left, yy cached / zz total)` hint. | Prompt/cached tokens, provider context window. | Informs user how much *uncached* context was consumed per request. |
| Core config/pipeline files | Infrastructure | Accept `extraHeaders` + `thinking` metadata and inject them into OpenAI requests (e.g., z.ai `thinking.type`, OpenAI `reasoning.effort`). Extend token limits for GLM-4.6 (200k) and GPT-5.1 (400k). | `ContentGeneratorConfig` from AppContainer. | Guarantees outbound requests match provider settings, keeps telemetry accurate. |

---

## 4. Data Modeling & State

### 4.1 Settings Schema Extensions (packages/cli/src/config/settingsSchema.ts)
```ts
providers: {
  selected?: string;
  custom?: Record<string, ProviderEntry>;
}

interface ProviderEntry {
  name: string;
  baseUrl?: string;
  defaultModel?: string;
  extraHeaders?: Record<string, string>;
  cachedModels?: string[];
  lastModelRefresh?: string;
  thinkingValues?: string[];
  thinkingValue?: string;
  thinkingParameter?: string; // e.g., 'thinking' (z.ai) or 'reasoning' (OpenAI)
  thinkingKey?: string;       // e.g., 'type' or 'effort'
  contextWindow?: number;     // e.g., 200_000 for GLM-4.6
}
```
API keys remain in `security.auth.providers.<id>.apiKey`; ProviderStore mirrors the most recent provider key into `security.auth.apiKey` for compatibility.

### 4.2 Runtime State / Bridges
- **Provider runtime sync** (`AppContainer.tsx`): whenever a provider is configured, selected, deleted, or thinking value changes, `config.updateCredentials({ baseUrl, model, extraHeaders, thinking })` is invoked. This keeps the OpenAI pipeline aligned with the provider metadata.
- **Model cache refresh**: `handleRefreshProviderModels` logs to history, calls `ProviderModelFetcher`, then persists results via `updateProviderModels` and re-applies runtime config.
- **Context telemetry**: `ContextUsageDisplay` pulls the provider context window (if defined) before falling back to `tokenLimit(model)`. Cached token counts from telemetry are displayed but do not affect the percent calculation anymore.

---

## 5. User & System Flows

### 5.1 `/auth` Flow (CoderPro bridge)
1. `/auth` opens `CoderProAuthDialog` (RadioButtonSelect). Option `1` still runs Qwen OAuth; option `2` enters provider wizard.
2. **Selection step** (`CoderProProviderSelection.tsx`): user sees templates + saved providers. Keyboard:
   - `Enter` – configure highlighted provider/template.
   - `p` – mark highlighted provider as active (immediately updates selection & runtime config). 
   - `a` – clone OpenAI template (unique id/time-based suffix).
   - `d` – delete highlighted provider (if active, AppContainer resets to Qwen defaults and switches auth back).
3. **Form step** (`CoderProProviderForm.tsx`): fields for display name, providerId, base URL, default model, extra headers, API key (masked), thinking values (comma separated), thinking parameter/key, and optional context window. Ctrl/⌘+T triggers `ProviderConnectionTester`; failure prompt shows S/E/D hints.
4. Submit path:
   - Save entry via `ProviderStore.saveCustomProvider` (includes thinking/context metadata).
   - Persist API key (`security.auth.providers[id].apiKey` + legacy mirror).
   - Set `providers.selected = id`, `model.name = defaultModel`, and `security.auth.selectedType = USE_OPENAI`.
   - Call `handleActiveProviderChange` → `AppContainer` invokes `config.updateCredentials({ baseUrl, model, extraHeaders, thinking })` then `handleAuthSelect(AuthType.USE_OPENAI, scope, credentials)`.
   - Kick off async `/models` refresh; success logs “Loaded N models”, failure logs toast but provider remains configured.
5. Wizard returns to selection or closes; `useAuthCommand` handles refreshAuth + spinner states as usual.

### 5.2 `/model` Flow
1. `/model` command checks `settings.merged.providers.selected` first; if set, `DialogManager` renders `CoderProModelDialog`. Otherwise it falls back to upstream dialog and surfaces the “No provider selected” error.
2. Dialog shows cached models (default model + `cachedModels`). Active model annotated with `*`. Footer hints: `R` refresh, `T` cycle thinking mode, `Esc` close.
3. Selecting a model triggers:
   - `config.setModel(model)` and `settings.setValue(scope, 'model.name', model)`.
   - `saveCustomProvider(..., { defaultModel: model })` to keep the provider default aligned.
   - `uiActions.handleProviderModelUpdated()` so AppContainer reapplies runtime config + logs.
4. Refresh (`R`) invokes `handleRefreshProviderModels` → history logs “Fetching models for <provider>…”, fetcher updates cache, and dialog rerenders.
5. Thinking toggle (`T`) cycles through provider-defined `thinkingValues` (including blank entries). Each change persists via `handleProviderThinkingChange` and immediately calls `config.updateCredentials` with the new reasoning payload.

### 5.3 Background Model Cache on Auth/Refresh
- On successful provider save or when the user presses `R`, `ProviderModelFetcher` calls `GET {baseUrl}/models` with `Authorization` + extra headers. Parsed IDs are deduped, sorted, and stored as `cachedModels` plus `lastModelRefresh`.
- Errors log via `historyManager.addItem({ type: 'error', text })` but never block provider usage.
- `ContextUsageDisplay` uses provider `contextWindow` when available; otherwise it falls back to `tokenLimit(model)` (which now includes GLM-4.6 and GPT-5.1 overrides).

---

## 6. States & Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No provider selected + user chooses `/model` | Dialog shows call-to-action to run `/auth` first; selection disabled |
| Provider saved but API key missing | `/auth` refuses to close until key provided; `/model` lists cached names but selection disabled with error banner |
| Model fetch returns non-200 | Show toast “Failed to list models for `<id>`”; keep previous `cachedModels` + set `providers.custom[id].lastModelRefresh` untouched |
| Multiple scopes (workspace vs user) | Provider saves default to workspace scope when `.qwen/settings.json` exists, else user scope (mirrors `settings.setValue` behavior). Documented in ProviderStore |
| Switching providers mid-session | Immediately call `config.updateCredentials` + `refreshAuth`; `/model` dialog reloads with new provider list |
| `extraHeaders` invalid (bad syntax) | Form validation fails locally; highlight field, instructions for `key=value[,key=value]` |
| Stale cache (>24h) | `/model` shows “Cache >24h old — press `r` to refresh” message |
| CLI offline | Refresh attempts fail gracefully; provider remains configured |

---

## 7. Error Handling & Observability
- Wrap `ProviderModelService.refresh` in try/catch, logging via existing telemetry (`logModelSlashCommand`) and new debug channel `provider.refresh`.
- `config.refreshAuth` errors already bubble to `/auth`; extend error text to mention provider id/base URL when AuthType is `USE_OPENAI`.
- Add debug logging when headers injected: `logger.debug('Using provider', { providerId, baseUrl })`.
- Telemetry: emit `model_slash_command` events with attributes `{ provider_id, source: 'cached'|'refreshed' }` for observability.

---

## 8. API Integration
- Endpoint: `GET {baseUrl}/models` (OpenAI schema). For z.ai the base URL is `https://api.z.ai/api/coding/paas/v4`; `/models` path appended by ProviderModelService.
- Auth: Bearer token header (`Authorization: Bearer sk-…`). For z.ai providers, the tenant header is automatically extracted from the API key format `tenantId.secretKey` and injected as `tenant: {tenantId}`. Additional extra headers are merged in order: defaults → provider extra headers → codex-pro style overrides.
- Response parsing: expect `{ data: [{ id: string }, …] }`; deduplicate & sort lexicographically.
- Timeouts: reuse `DEFAULT_TIMEOUT` and `DEFAULT_MAX_RETRIES` from `openaiContentGenerator/constants`.

---

## 9. Non-Functional Requirements
- **Persistence**: Provider selections & cached models survive CLI restarts via `.qwen/settings.json`.
- **Security**: API keys stored in `security.auth.providers[id].apiKey` (user scope) and never written to workspace unless user explicitly scopes there. Continue to mirror into in-memory `_generationConfig` only.
- **Performance**: Cache refresh call should complete <2s; show spinner if longer.
- **Isolation**: All new files live under `packages/cli/src/coder-pro` and `packages/core/src/coder-pro` (if needed). Upstream files only gain minimal bridge imports (documented in `AGENTS.md`).

---

## 10. Feature Flags & Configuration
- `CODER_PRO_PROVIDER_BRIDGE=0` (env) disables the fork and falls back to upstream dialogs (safety valve for debugging).
- `CODER_PRO_PROVIDER_REFRESH_INTERVAL_HRS` (default 24) controls auto-refresh cadence.
- Templates (OpenAI, z.ai) live in `ProviderStore.templates.ts` so additional providers can be added without UI rewrites.

---

## 11. Testing Strategy
- **Unit Tests**
  - ProviderStore CRUD + scope resolution (`packages/cli/src/coder-pro/providers/__tests__`).
  - ProviderModelService happy path + network failure (mock fetch/OpenAI client).
  - CoderProAuthDialog validation (missing key, invalid headers, template switching).
  - CoderProModelDialog (renders cached models, handles refresh action, persists selection).
- **Integration Tests**
  - Non-interactive `/auth --provider=zai` scenario (similar to codex-pro `agentic_commands.rs` tests) verifying settings JSON output.
  - `/model` slash command snapshot ensuring list reflects cached models.
- **Manual QA**
  - Authenticate with z.ai template (enter sample key) → confirm `.qwen/settings.json` updates and CLI reuses provider after restart.
  - Trigger refresh offline → expect toast + stale cache indicator remains.
  - Switch back to OpenAI template → confirm base URL + headers reset and old cache hidden.

---

## 12. Accessibility & CLI UX
- Maintain Ink color contrasts (accent colors already defined). Provide textual cues (“Press R to refresh models”) for non-color contexts.
- Input fields should display caret (`>`) and labels identical to upstream so screen readers continue to parse.

---

## 13. Dependencies & Migration
- No new npm deps; reuse `node-fetch` already in repo.
- Migration path: upon first run after upgrade, migrate existing OpenAI config into ProviderStore (`selected = 'openai'`, create default entry using prior `security.auth.baseUrl/model`). Documented in release notes.

---

## 14. Handoff Checklist for AI Implementation
- [ ] ProviderStore + schema landed with unit tests.
- [ ] New dialogs wired via bridge modules; upstream components untouched.
- [ ] Config + OpenAI provider accept `providerId` + `extraHeaders`.
- [ ] `/auth` + `/model` commands exercise new dialogs.
- [ ] Model caching + refresh telemetry verified.
- [ ] `AGENTS.md` updated with specific bridge points (files & rationale).

---

## 15. Maintenance & Evolution
- Future providers (DeepSeek, OpenRouter) can reuse ProviderStore template mechanism.
- To drop customization, flip `CODER_PRO_PROVIDER_BRIDGE=0` and remove coder-pro overrides (documented hook points ease revert).
- Monitor upstream changes to `/auth` or `/model`; because coder-pro forks live separately, rebases only need to update bridge components when desired.

---

## 16. Appendix

### 16.1 Sample Settings Snippet
```json
{
  "providers": {
    "selected": "zai",
    "custom": {
      "zai": {
        "name": "z.ai",
        "baseUrl": "https://api.z.ai/api/coding/paas/v4",
        "defaultModel": "glm-4.6",
        "cachedModels": ["glm-4.5", "glm-4.6"],
        "lastModelRefresh": "2025-11-17T08:00:00Z"
      }
    }
  },
  "security": {
    "auth": {
      "selectedType": "use_openai",
      "providers": {
        "zai": { "apiKey": "sk-***" }
      }
    }
  },
  "model": { "name": "glm-4.6" }
}
```

**Note**: The `tenant` header is no longer required in `extraHeaders` for z.ai providers. The tenant ID is automatically extracted from the API key format `tenantId.secretKey` (e.g., `a1b2c3d4e5.f6g7h8i9j0` → tenant: `a1b2c3d4e5`).

### 16.2 Tenant ID Auto-Extraction Implementation
For z.ai providers, the tenant ID is automatically extracted from the API key format at runtime:

**API Key Format**: `tenantId.secretKey` (e.g., `a1b2c3d4e5.f6g7h8i9j0`)

**Extraction Logic** (implemented in `AppContainer.tsx`):
```typescript
// For z.ai providers, extract tenant from API key
const contentGeneratorConfig = config.getContentGeneratorConfig();
if (provider?.baseUrl?.includes('api.z.ai') && contentGeneratorConfig.apiKey) {
  const tenantId = contentGeneratorConfig.apiKey.split('.')[0];
  extraHeaders = {
    ...extraHeaders,
    tenant: tenantId,
  };
}
```

**Benefits**:
- No manual tenant configuration required
- Automatic tenant extraction from API key
- Reduced configuration complexity for users
- Eliminates potential tenant ID mismatches

### 16.3 Reference Implementation Notes
- Codex-pro BYOK reference: `codex-rs/tui/src/app.rs#3836-4832`, `codex-agentic-core/src/provider/mod.rs#313-520`, `core/src/config/mod.rs#78-138`.
- Model caching mirror: `fetch_custom_provider_models` in codex-pro for `/models` endpoint behavior.

---

**End of Technical Functional Requirements Document**
