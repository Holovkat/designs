---
**Context**: This document describes changes applied on top of the OpenAI Codex repository.  
**Prerequisites**: Phase -1 complete (repo cloned and builds).  
**Working Directory**: Root of the OpenAI Codex clone
---

## 11 — ACP Mode Behaviour (Shared CLI Subcommand)

**Goal**: Expose the Agent Communication Protocol (ACP) over stdio by default while optionally mirroring traffic over HTTP when `--http` is provided. Editors such as Zed or Cursor launch ACP agents via subprocess pipes (`codex-agentic acp`), so the stdio transport must remain first-class. The subcommand reuses the shared Clap parser and command registry so ACP traffic invokes the same handlers as the CLI and TUI.

### Current Status (2025‑10‑17)

- `codex-agentic acp` performs the full ACP JSON-RPC handshake (`initialize`, `authenticate`, `session/new`, `session/prompt`, `session/cancel`) over stdio and streams `session/update` notifications. The optional HTTP façade is available when explicitly requested.
- CLI overrides and BYOK auto-detection are persisted into the runtime config before ACP sessions start, so slugs like `glm-4.6` correctly resolve to the `zai` provider and no longer return 400 “Unsupported model” errors.
- ACP sessions inherit the minimal coding-plan system prompt automatically when the selected provider requires it (e.g., z.ai GLM endpoints). This keeps non–GPT-5 models within provider constraints while matching the behaviour of the TUI and CLI.
- Provider-specific tooling sanitiser now disables plan/apply_patch/web-search/view-image tooling for Coding Plan providers, preventing the “prompt parameter missing” errors observed when ACP attempted tool calls against z.ai. All surfaces (TUI/CLI/ACP/exec) share this guard.
- Streamed agent output now de-duplicates the final response chunk, preventing the repeated assistant messages that previously appeared at turn completion.
- Slash-command responses that span multiple lines (e.g., `/status`, `/models`, `/mcp`) render inside ```text fences so editors preserve ASCII framing and whitespace.

### Outstanding Follow-ups

- Capability negotiation for tool and permission flows, additional transports (MCP, terminal attachments), and richer cancellation semantics remain out of scope.
- Zed still launches from the workspace root in some configurations; confirm whether the resolver scoring keeps selecting the intended `codex-rs/settings.json` once editor launch paths stabilise.

### Completed Implementation Checklist

- [x] CLI wiring (`codex-rs/cli/src/main.rs`) routes the `acp` subcommand through `acp_cmd::run` and shares the command registry.
- [x] ACP CLI surface (`cli/src/acp_cmd.rs`) exposes stdio by default, optional HTTP via flags, and persists CLI overrides into the runtime configuration before launching.
- [x] Core host (`codex-agentic-core/src/acp/mod.rs`) defines `RuntimeOptions`, manifest helpers, and command execution plumbing.
- [x] Stdio adapter (`codex-agentic-core/src/acp/stdio.rs`) handles ACP JSON-RPC, streams updates, sanitises plan output, and de-duplicates agent responses.
- [x] HTTP adapter (`codex-agentic-core/src/acp/http.rs`) mirrors ACP runs when explicitly enabled without affecting stdio.
- [x] Model/provider resolution ensures BYOK selections (e.g., z.ai) are merged into the runtime config prior to ACP launch, aligning behaviour with the TUI.
- [x] Provider capability sanitiser disables unsupported tooling (plan/apply_patch/web-search/view-image) for Coding Plan providers, so ACP and other surfaces send text-only payloads to z.ai.
- [x] Status card rendering and slash command outputs produce Markdown code fences to preserve formatting in ACP clients.

### Notes

- Keep everything Clap-driven; avoid handwritten argument parsing.
- Stdio remains the default transport for editor integrations. HTTP should only activate when `--http` is supplied.
- Follow the ACP JSON-RPC contract (handshake, sessions, permissions) and REST contract for optional HTTP mirroring. Use the upstream Quickstart echo agent as a behavioural baseline.
- Reuse the shared `CommandRegistry` so ACP behaviour stays aligned with CLI/TUI command handlers.
- Document any deviations or extensions (e.g., additional metadata fields) inside the ACP module for future maintainers.

### References

- GitHub repository: <https://github.com/zed-industries/agent-client-protocol>
- ACP docs: <https://agentclientprotocol.com/overview/introduction>
- Versioned spec (v0.4.0): <https://zed-industries.github.io/agent-client-protocol/>
