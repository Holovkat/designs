# API Integration – GLM CodePlan & GPT‑5 Codex

## Endpoints
| Provider | Endpoint | Notes |
|----------|----------|-------|
| z.ai GLM | `https://api.z.ai/api/coding/paas/v4` | Supports plan + execute routes via `POST /codeplan` and `POST /chat/completions`. |
| z.ai GLM (CN) | `https://open.bigmodel.cn/api/coding/paas/v4` | Same schema, different region. |
| OpenAI | `https://api.openai.com/v1` | Standard Chat/Responses endpoints; `gpt-5-codex` requires `responses` API with reasoning payload. |

## Request Shapes
### GLM CodePlan
```jsonc
POST /codeplan
{
  "model": "glm-4.6-codeplan",
  "prompt": "...",
  "context": { "files": [...], "git": {...} },
  "settings": { "max_steps": 12, "risk_tolerance": "medium" }
}
```
Bridge converts Qwen conversation into `prompt` and attaches workspace metadata (files, git status) similar to Codex CLI’s plan workflow.

### GPT‑5 Codex (Responses API)
```jsonc
POST /responses
{
  "model": "gpt-5-codex",
  "reasoning": { "effort": "medium" },
  "input": [...messages...],
  "metadata": { "provider": "bridge" }
}
```

## Error Handling
- Retry (exponential backoff, max 3 attempts) on HTTP 429/500 for both providers.
- Map provider-specific errors to Qwen’s `FatalError` with actionable hints (e.g., missing CodePlan permission).
- Log request IDs but never payload bodies.

## Telemetry & Logging
- Each API call emits `bridge_api_call` telemetry with fields:
  - `providerId`
  - `model`
  - `endpoint`
  - `latencyMs`
  - `success` / `errorCode`
- Logs surface summary lines prefixed with `[bridge]` to distinguish from upstream output.
