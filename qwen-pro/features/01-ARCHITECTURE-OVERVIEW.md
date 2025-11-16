# Architecture Overview – Custom Provider Bridge

## Goals
- Inject GLM CodePlan + GPT‑5 Codex support without forking Qwen Code core.
- Keep bridge upgrade-friendly: upstream sync only needs re-hooking via limited touchpoints.

## High-Level Diagram
```
┌────────────────┐        ┌────────────────────────┐
│ Qwen Code Core │        │ Bridge Package         │
│ (upstream)     │        │ bridges/qwen-custom    │
├────────────────┤        ├────────────────────────┤
│ packages/core  │ <───── │ providerAdapters.ts    │
│ packages/cli   │   APIs │ commandHooks.ts        │
│ scripts/start  │        │ configExtensions.ts    │
└────────────────┘        └────────────────────────┘
                                   │
             ┌─────────────────────┴─────────────────────┐
             │                                           │
   ┌─────────────────────┐                      ┌─────────────────────┐
   │ GLM CodePlan Layer  │                      │ GPT‑5 Codex Layer   │
   │ glmProvider.ts      │                      │ gpt5Provider.ts     │
   │ codeplanWorkflow.ts │                      │ reasoningDefaults.ts │
   └─────────────────────┘                      └─────────────────────┘
```

## Integration Points
1. **Startup Hook**  
   - `scripts/start.js` (or `packages/cli/src/bootstrap.ts`) dynamically imports the bridge after verifying that `bridges/qwen-custom/dist/index.js` exists.  
   - The bridge registers providers/commands via exported functions with explicit interfaces so upstream files only require ~3 lines for re-hooking.

2. **Provider Injection**  
   - Bridge keeps a registry of additional `OpenAICompatibleProvider` implementations and exposes `getProviderFor(baseUrl)`.  
   - Qwen Code core calls this hook before falling back to its own provider map.

3. **Command Surface**  
   - `/codeplan` command lives entirely inside bridge and attaches to the CLI using existing extension APIs (same pattern as IDE extensions).  
   - Approval dialogs and telemetry route through the shared CLI event bus; no upstream modifications beyond event registration.

4. **Config Overlay**  
   - Bridge loads `.qwen/custom/providers.json` (or similar) and merges it with the in-memory config object provided by Qwen Code.  
   - This avoids mutating upstream schema files; upgrades simply re-export bridge metadata.

## Data Flow Summary
1. User launches `qwen`. Startup loads bridge if present.  
2. When a session selects `provider: zai` or `model: gpt-5-codex`, Qwen Code consults bridge registry to obtain the adapter.  
3. Adapter handles auth headers, token normalization, plan generation, and telemetry.  
4. Responses flow back into standard CLI UX; the bridge only mediates API calls and plan-state tracking.  
5. Logs/metrics include `provider.id` so upstream telemetry remains intact.
