# Change Log

## Unreleased (post-v0.2.2 on `main`)
- Added configurable OpenAPI context windows so agents can tune request limits without patching source (`feat: openApi configurable window`, 29261c75).
- Expanded the OpenAI converter to handle cached token payloads emitted by alternative backends, preventing replay failures in migration utilities (`feat: add support for alternative cached_tokens format`, f0e21374).

## v0.2.2 · 2025-11-13
- Introduced a fuzzy matching pipeline inside the Edit Tool to keep patches aligned even when upstream files drift (#1025).
- Shipped the Interactive Approval Mode dialog so contributors can switch among default, plan-only, auto-edit, and YOLO flows without restarting (#1012).
- Standardized tool naming/registration across CLI, web search, and extensions, reducing casing mismatches at runtime (#1004).
- Limited noisy request-error logging to debug sessions and refreshed the agent template docs plus DashScope DeepSeek token regexes (#1026, #1006, #817).

## v0.2.1 · 2025-11-10
- Extended the Zed ACP integration with TodoWriteTool + TaskTool, enabling task triage without leaving the IDE (#992).
- Fixed ACP newline handling on Windows so multi-line content splits correctly during approvals (#996/#6aaac12d).

## v0.2.0 · 2025-11-07
- Refined glob/grep/ripgrep search tools for consistent include/exclude semantics and better multi-file hints (#969).
- Centralized CLI system diagnostics and surfaced VS Code detection fixes to stabilize IDE auto-launch (#981/#983).
- Added customizable model training & tool-output controls so operators can choose when results persist or stream (#981).

## v0.1.5 · 2025-11-05
- Launched the multi-provider web search stack with DashScope + fallback hints, OAuth credit tracking, and CLI docs for the tool suite (#885 et al.).
- Added configuration + docs for redirecting OpenAI logging output and selecting custom working directories when spawning CLI subprocesses (#972/#936).
- Updated token limits (e.g., Kimi-2) and hardened AbortError handling to keep commands responsive during retries (#970/#935).

## v0.1.4 · 2025-11-04
- Fixed `/ide install` on Windows and bundled missing macOS sandbox seatbelt profiles so packaged builds run cross-platform (#957/#949).

## v0.1.3 · 2025-10-31
- Completed the rebrand from “Gemini” to “Qwen Code” across CLI help text, UI tool lists, and docs (#929/#933).
- Refactored ripgrep integration, improved session ID handling, and patched settings migration/compression bugs (#930/#927/#937/#935).

## v0.1.2 · 2025-10-29
- Stabilized cloud/Vitest e2e suites, refreshed `/chat list` output expectations, and documented new extension hooks (#904/#905/#892).
- Hardened input filtering plus ANSI handling to keep transcript exports plain-text friendly (#7ccba756/#e0e5fa50).

## v0.1.1 · 2025-10-27
- Published the bundled CLI binary, reorganized workspace directories, and synced upstream Gemini CLI v0.8.2 (#866/#838).
- Updated tool output formatting (plain strings instead of JSON blobs), added `/model` docs, and tightened cancellation + token-limit enforcement (#881/#872/#754/#724).
- Fixed numerous UX issues: stuck auth dialogs, missing trace IDs, invalid tool_calls payloads, and outdated CLI options (#804/#791/#790/#685).

## v0.0.14 · 2025-09-29
- Added task-planning “plan mode”, hardened edit correction, and expanded DashScope cache controls plus Qwen3-VL-Plus token limits.

## v0.0.13
- Introduced YOLO mode for automated approvals, repaired OAuth/Zed auth flows, improved Windows markdown rendering, and refreshed docs.

## v0.0.12
- Enabled vision model auto-switching, synced Gemini CLI v0.3.4 changes, overhauled subagents, and fixed keybindings/terminal flicker on Windows.

## v0.0.11
- Debuted subagents + “Welcome Back” dialog, rewrote token limit management, added Terminal Bench tests, and solved multiple Windows/auth bugs.

## v0.0.10
- Synced from Gemini CLI v0.2.1 and introduced the todo write tool for tracking work.

## v0.0.9
- Pulled in Gemini CLI v0.1.21, improved token synchronization, added `is_background` to shell tool, upgraded memory management, and expanded IDE integration.

## v0.0.8
- Synced with Gemini CLI v0.1.19, rebranded docs, and added deterministic DashScope cache control plus `.qwenignore`-aware grep.

## v0.0.7
- Synced v0.1.18 features, fixed MCP/Web tools, switched web search to Tavily, and improved logging + tool-call resilience.

## v0.0.6
- Logged Qwen usage statistics, aligned `/init` behavior with configured context files, and fixed macOS sandbox + vision login glitches.

## v0.0.5
- Added Qwen OAuth login (2,000 daily free calls), synced Gemini CLI v0.1.17, and introduced `systemPromptMappings`.
