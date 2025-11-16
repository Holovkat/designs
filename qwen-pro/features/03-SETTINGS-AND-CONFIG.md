# Settings & Configuration – Custom Provider Bridge

## New User-Facing Settings (`~/.qwen/settings.json`)
```jsonc
{
  "customProviders": {
    "zai": {
      "baseUrl": "https://api.z.ai/api/coding/paas/v4",
      "apiKey": "ZAI_xxx",
      "codeplan": { "enabled": true, "maxSteps": 12 }
    },
    "gpt5codex": {
      "baseUrl": "https://api.openai.com/v1",
      "model": "gpt-5-codex",
      "reasoningEffort": "medium"
    }
  },
  "defaultProvider": "zai",
  "fallbackProviders": ["qwen3-coder-plus", "gpt-5-codex"]
}
```

### Notes
- `customProviders.*.codeplan.enabled` ensures we only expose the `/codeplan` UX when the backend supports it.
- `reasoningEffort` matches Codex CLI semantics (low/medium/high) and is consumed solely by the bridge.

## Bridge Runtime Config (`features/bridge/config/*.ts`)
- `settingsOverlay.ts` reads the user settings, validates schema (AJV), and merges into Qwen’s in-memory config via hook:
  ```ts
  export function extendConfig(cliConfig: Config) {
    const custom = loadCustomSettings();
    cliConfig.setCustomProviders(custom.providers);
  }
  ```
- Secrets are stored via Qwen’s existing credential helpers; the bridge never writes raw keys to disk.

### GLM Bridge Configuration
- The bridge’s runtime loader (`bridges/qwen-custom/src/config/customProviders.ts`) re-uses `~/.qwen/settings.json` (optionally supplemented by `/auth custom`) to hydrate `customProviders.zai` entries.
- Settings are merged with the following priorities: process env overrides (`GLM_API_KEY`, `GLM_BASE_URL`), user `settings.json`, and built-in defaults (`https://api.z.ai/api/coding/paas/v4`, `request_type=codeplan`). This loader also surfaces `codeplan.maxSteps` and `codeplan.riskTolerance`, which the workflow uses when sending requests.
- The bridge persists every generated plan to `.qwen/sessions/codeplan-<timestamp>/codeplan.json`, ensuring recovery of plan metadata if execution is interrupted.

## Environment Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `QWEN_BRIDGE_ROOT` | Absolute path to compiled bridge package | `designs/qwen-pro/features/bridge/dist` |
| `GLM_API_KEY` | Optional override for `customProviders.zai.apiKey` | unset |
| `GLM_BASE_URL` | Override the GLM CodePlan endpoint (useful for CN mirror) | unset |
| `GPT5_CODEX_API_KEY` | Optional override for GPT‑5 Codex provider | unset |

## CLI Flags
- `--provider=zai` activates GLM CodePlan.
- `--provider=gpt5codex` forces GPT‑5 Codex and enables reasoning toggles.
- `--codeplan-only` starts the CLI directly in plan mode (bridge-owned command).
