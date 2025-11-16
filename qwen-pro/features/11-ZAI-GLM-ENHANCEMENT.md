# Enhancement 11 – z.ai GLM CodePlan Bridge

## Objective
Deliver a self-contained bridge module that adds CodePlan support for z.ai GLM models without modifying upstream Qwen Code core.

## Deliverables
1. **Bridge Package Scaffolding**
   - Create `features/bridge` workspace (or external repo) with `package.json`, `tsconfig.json`, `tsup.config.ts`.
   - Entry point exports `init({ config, services })`, `registerProviders`, and `registerCommands`.

2. **Provider Adapter**
   - Implement `glmProvider.ts` that extends the upstream `OpenAICompatibleProvider` contract via composition.
   - Features:
     - Base URL detection for `https://api.z.ai/api/coding/paas/*` and `https://open.bigmodel.cn/api/coding/paas/*`.
     - Header injection (tenant ID/JWT), cache control flags, retry policy (3 attempts, exponential backoff).
     - Telemetry metadata (`providerId=zai`, request IDs, latency).

3. **CodePlan Workflow**
   - `codeplanWorkflow.ts` handles:
     - Plan generation request (`POST /codeplan`), parsing step list, storing artifact in `.qwen/sessions/<id>/codeplan.json`.
     - Execution orchestration that converts plan actions into Qwen tool calls / shell executions.
     - UX integration: renders Ink component inside CLI to show progress and approvals.

4. **Configuration & Auth**
   - Extend settings overlay to load `customProviders.zai` from `~/.qwen/settings.json`.
   - `/auth custom` prompts for API key, optional tenant, CodePlan toggle.
   - Provide env overrides `GLM_API_KEY`, `GLM_BASE_URL`.

5. **Testing**
   - Unit: provider detection, request shaping, plan parser.
   - Integration: mock server verifying `/codeplan` happy path, failure fallback to Qwen3.
   - Terminal Bench: add GLM scenario for CLI transcript comparison.

6. **Documentation**
   - Update `features/glm-codeplan-gpt5-support-tfd.md`, `03-SETTINGS-AND-CONFIG.md`, and README addendum to describe GLM usage.
   - Include troubleshooting tips (missing permissions, expired tokens).

## Step-by-Step Plan
1. Scaffold bridge workspace and wire local `npm link`.
2. Add startup loader to `qwen-code/scripts/start.js` to `import('@holovkat/qwen-custom-bridge')` when available.
3. Implement provider registry + `registerProviders` hook.
4. Build `glmProvider.ts` with API client (fetch/OpenAI style) and request decorators.
5. Create CodePlan workflow module + Ink UI components.
6. Expose `/codeplan` CLI command via `registerCommands`.
7. Write unit tests (Vitest) and integration tests (Vitest + mock server).
8. Document config/auth steps; add entries to change-log.
9. Verify end-to-end manually; capture logs/telemetry for reference.
10. Publish bridge package (or tag) and update dependency references.
