# Frontend Technical Functional Requirements Document (TFD)

## Document Metadata
- **Project Name**: Qwen Code – Multi-Provider Model Expansion
- **PRD Reference**: TBD (Holovkat tracking doc)
- **Version**: 0.1.0
- **Last Updated**: 2025-11-16
- **Author**: Codex (assistant)
- **Target Completion**: 2025-12-15

---

## 1. Executive Summary

### 1.1 Project Overview
We need to extend the Qwen Code CLI so it can run fully agentic “codeplan” sessions on z.ai GLM models, while also treating OpenAI’s `gpt-5-codex` family as first-class backends (similar to the Rust-based Codex CLI). This requires reviewing current Kimi K2 and DeepSeek support, unifying provider detection, and surfacing CodePlan-specific UX affordances in the CLI.

### 1.2 Technical Stack
- **Runtime**: Node.js 20+, TypeScript ES modules
- **Packages**: Workspaces under `packages/cli`, `packages/core`, `packages/vscode-ide-companion`
- **UI**: Ink/React components via `packages/cli/src/ui`
- **Agent Core**: `packages/core` services (chatCompressionService, tokenLimits, openaiContentGenerator)
- **Build Tooling**: Custom `scripts/build*.js` (esbuild) + npm workspaces
- **Testing**: Vitest (unit + integration), Terminal Bench harness

### 1.3 Implementation Phases
1. **Phase 1 – Discovery Baseline**: Document current provider coverage (DashScope, DeepSeek, token limits) and map config touch points.
2. **Phase 2 – Provider Abstractions**: Introduce GLM provider detection and shared OpenAI-compatible interfaces (mirroring Codex CLI’s `provider_id_is_zai` approach).
3. **Phase 3 – Enhancement 11 (z.ai GLM CodePlan)**: Implement `/codeplan` command surface, streaming renderers, and metadata pipeline for GLM planning endpoints.
4. **Phase 4 – Enhancement 12 (GPT-5 Codex Enablement)**: Wire `gpt-5-codex` defaults, reasoning flags, and fallback plan execution akin to Codex CLI.
5. **Phase 5 – Testing & Telemetry**: Expand integration tests (CLI + sandbox) and add telemetry fields for provider/model provenance.
6. **Phase 6 – Docs & Release**: Update README, AGENTS, change-log, and rollout guidance.

---

## 2. Atomic Design / Architecture Alignment
- **Atoms**: Core services (`tokenLimits.ts`, `openaiContentGenerator/*`, `config/config.ts`), shared types, telemetry emitters.
- **Molecules**: Provider implementations (`dashscope.ts`, `deepseek.ts`, new `glm.ts`, `openai-gpt5.ts`) composing atoms with CLI config.
- **Organisms**: CLI flows (nonInteractiveCli, UI dialogs, approval workflows) that orchestrate prompts/tools.
- **Templates**: Scenario handlers (agent modes, `/codeplan` wizard) with provider-agnostic scaffolding.
- **Pages**: End-to-end commands triggered via `qwen`, e.g., plan mode, edit loops, code review.

Directory reminder:
```
packages/
├── cli/          # UI + command router
├── core/         # services, providers, token logic
└── vscode-ide-companion/
integration-tests/  # e2e + terminal bench
```

---

## 3. Current Provider Support Assessment
- **Kimi K2 (Moonshot)**: Only token-window awareness exists today (`packages/core/src/core/tokenLimits.ts` Maps K2 variants to 128K/256K and normalizes preview suffixes). No specialized provider class—requests ride the default OpenAI-compatible path, which means no Kimi-specific headers or rate-limit handling.
- **DeepSeek**: Has bespoke provider logic (`packages/core/src/core/openaiContentGenerator/provider/deepseek.ts`) that flattens multi-part messages to plain text (DeepSeek rejects non-text content) while still sharing retries/timeouts with `DefaultOpenAICompatibleProvider`. Input/output caps live in `tokenLimits.ts` and `OUTPUT_PATTERNS`.
- **GLM**: Only token limits are defined (pattern matches for `glm-4.5`, `glm-4.6`). There is no provider detection, auth story, or API shim for CodePlan endpoints (`api.z.ai/.../coding/paas`).
- **OpenAI GPT-* Models**: Supported generically through the default provider + token limit table, but `gpt-5-codex` is absent from normalization + CLI defaults (`qwen-code` still orients around Qwen3, O-series, Claude). No reasoning toggle metadata similar to Codex CLI’s `ReasoningEffort`.

---

## 4. Functional Requirements

### 4.1 Enhancement 11 – GLM Provider Detection & Config
- Accept new provider alias `zai` with base URLs (`https://api.z.ai/api/coding/paas/*`, `https://open.bigmodel.cn/api/coding/paas/*`). Mirror Codex CLI’s detection helpers (`codex-rs/core/src/config/mod.rs` functions `provider_id_is_zai` + `base_url_is_zai`).
- Extend CLI config schema: `modelProvider` entry with OAuth + API key support, plus cached model list (similar to `CustomProvider.cached_models` in `codex-rs/cli/src/agentic_commands.rs`).
- Add `GlmOpenAICompatibleProvider` implementing `OpenAICompatibleProvider`. Responsibilities: JWT header injection, request metadata for CodePlan, region-aware endpoints, and autop-run `codeplan` request_type.
- The bridge now exposes `bridges/qwen-custom/src/providers/glmProvider.ts` for detection + request shaping, `bridges/qwen-custom/src/config/customProviders.ts` for loading `.qwen` overrides, and `codeplanWorkflow.ts` for orchestrating plan generation/persistence. These files form the GLM entrypoint so Qwen can tap into `provider_id_is_zai` without touching core packages.

### 4.2 CodePlan Workflow
- Introduce `/codeplan` command + `--codeplan` flag that triggers two-step GLM flow (1) planning (structured JSON plan) (2) execution/resolution. Manage plan tokens separately to avoid polluting conversation history.
- UI Requirements: Display planning steps with progress, allow user to approve/reject each action (mirrors planned “Interactive Approval Mode”), persist plan artifact to `.qwen/sessions`.
- Tooling: Provide adapter so GLM plan schema (parallel to Codex Rust’s plan/resume loops) maps to Qwen Code’s task runner and shell execution service.

### 4.3 Enhancement 12 – GPT-5-Codex Support
- Update token normalization to include `gpt-5`, `gpt-5.1`, and `gpt-5-codex` (input: 2M tokens, output: 8K default). Accept `openai/gpt-5-codex` style namespaces (strip provider prefix).
- Allow CLI defaults to target `gpt-5-codex` when `--model` unset on macOS/Linux, inspired by Codex CLI constants (`OPENAI_DEFAULT_MODEL`, `OPENAI_DEFAULT_REVIEW_MODEL`).
- Add reasoning settings (effort low/medium/high) per request, with CLI flag `--reasoning-effort` and config entry aligning with Codex CLI’s `ReasoningEffort`.

### 4.4 Configuration & UX
- Extend `/auth` and `/model` dialogs to show GLM + GPT-5 options, including helpful copy for rate limits, sandbox compatibility, and code execution requirements.
- Ensure `tokenLimits` + `applyOutputTokenLimit()` enforce new caps, and `dashscope` provider remains unaffected via feature flags.
- Document fallback sequence: GLM CodePlan → Qwen3-Coder (if GLM unavailable) → GPT-5-Codex (if requested). Provide telemetry fields `provider.id`, `model.family`, `codeplan.phase`.

---

## 5. Non-Functional Requirements
- **Performance**: Planning requests must surface within 2s for plan metadata; execution inherits standard streaming latencies.
- **Reliability**: Provider fallback, retries (x3) for GLM endpoints, and status badges in CLI header.
- **Security**: Never log GLM API keys; `.qwen/settings.json` additions must respect existing encryption semantics. Validate all CodePlan actions before execution (no implicit shell).
- **Observability**: Emit telemetry events for `codeplan_started`, `codeplan_step`, `codeplan_completed`, `provider_error` with provider/model tags.

---

## 6. External References & Inspiration
- **Holovkat/codex-pro (Rust)**: 
  - `codex-rs/core/src/config/mod.rs` provides default model constants and z.ai detection helpers we can port.
  - `codex-rs/cli/src/agentic_commands.rs` shows how provider lists include cached GLM models and how BYOK providers are surfaced in CLI output.
  - Scripts such as `codex-rs/scripts/zai_probe.sh` illustrate health-check probes we can recreate in Node for diagnostics.

---

## 7. Testing Strategy
- Unit: Provider detection utilities, token limit expansions, config parsing.
- Integration: New Vitest suites under `integration-tests/codeplan/*.test.ts` to cover plan approval flows, plus updates to existing CLI interaction tests.
- Terminal Bench: Add GLM scenario to `integration-tests/terminal-bench` to protect streaming + plan rendering.
- Manual: End-to-end smoke using actual GLM + GPT-5 credentials (documented checklist).

---

## 8. Open Questions & Risks
- Does GLM CodePlan require multi-part uploads (files/images)? Determine API schema before finalizing provider.
- Need clarity on rate limits + concurrency for `gpt-5-codex` beta endpoints.
- Confirm whether CodePlan should interleave with existing plan mode or remain GLM-only.
- Evaluate if we should reuse Codex CLI’s TOML config format or stay with `.qwen/settings.json`.

---

## 9. Handoff Checklist
- [ ] Provider detection + config documented
- [ ] Token limits updated + tested
- [ ] `/codeplan` UX designs approved
- [ ] Telemetry schema extended
- [ ] Docs (README, AGENTS, change-log) updated
- [ ] Release plan greenlighted

---

## 10. Maintenance & Next Steps
- Once MVP ships, iterate on mixed-provider sessions (GLM plan + GPT-5 exec).
- Consider extracting provider registry + heuristics to shared package for reuse between Qwen Code and Codex CLI.
