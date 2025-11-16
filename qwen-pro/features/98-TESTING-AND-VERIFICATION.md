# Testing & Verification – Custom Provider Bridge

## Unit Tests
- `providerRegistry.test.ts`: ensures GLM/GPT‑5 providers register and resolve correctly.
- `glmProvider.test.ts`: mocks z.ai endpoints to verify request shaping, header injection, retry logic.
- `codeplanWorkflow.test.ts`: validates plan parsing, approval flow, and fallback handling.

## Integration Tests
- **CLI E2E (Vitest)**  
  - Scenarios: `/codeplan` happy path, GLM failure fallback to Qwen3, GPT‑5 reasoning toggle.  
  - Uses local mock server to emulate API responses.
- **Terminal Bench**  
  - Add test suite under `integration-tests/terminal-bench/glm/` to compare expected transcripts.

## Manual Verification
1. Install bridge locally (`npm install ../features/bridge`).
2. Run `npm run start` and authenticate for GLM + GPT‑5.
3. Execute `/codeplan` on sample repo; confirm plan steps show and approvals execute commands.
4. Switch provider to `gpt-5-codex`, run non-plan session, verify reasoning output includes “AgentReasoning” events.

## Regression Strategy
- Guard critical flows with snapshot tests (plan schema, telemetry payloads).
- Maintain compatibility suite whenever upstream Qwen updates provider APIs.
