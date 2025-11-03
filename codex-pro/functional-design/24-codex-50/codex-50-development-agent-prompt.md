# Codex 0.50.0 Development Agent Prompt

Use this prompt when handing off to the implementation agent after planning is complete.

## Linked Artefacts
- Upgrade plan: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/codex-50/codex-0.50.0-upgrade-plan.md`
- Requirements summary: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/24-codex-50/codex-50-upgrade-requirements.md`
- Planning prompts: `/Users/tonyholovka/workspace/codex-pro/designs/codex-pro/functional-design/24-codex-50/codex-50-agent-prompts.md`

## Implementation Prompt (Populate Before Handoff)
```
You are preparing to align macicodex with upstream OpenAI Codex release rust-v0.50.0.

Current state (as of 2025-10-27):
- Baseline (fork main SHA): e81ecf8de5fb4f1af2c96eabc6b6dce3a2e1c65d
- Planning branch: `codex-50-alignment` (documentation-only)
- codex-core submodule SHA: b4123b7b1db22a3c0a8b133a23c7b30a477d7b65 (`rust-v0.50.0`)
- Custom features to preserve: codex-agentic CLI workflows, semantic index integration, BYOK provider plumbing, workflow adjustments & automation hooks, backend surface (app-server, responses proxy, feedback ingestion), security/telemetry additions, downstream-only patches catalogued in upgrade plan.
- Outstanding downstream refactor prerequisites:
  - TuiProgressSink wiring + `/index build` command – In progress (self-owned)
  - Indexing overlay polish & snapshot validation – In progress (self-owned)
  - Full regression sweep post-merge – Scheduled (self-owned)

Your responsibilities:
1. Start from a clean codex-agentic `main` (record the SHA, confirm `cargo check -p codex-tui` passes) and roll upstream `rust-v0.50.0` commits *onto that branch*—no re-copying downstream code from scratch. Keep the upstream `git log rust-v0.47.0..rust-v0.50.0 --merges --oneline` table open in the upgrade plan and tick off each entry as you merge it.
2. Merge commits strictly in chronological order. Honour the documented cadence (e.g., build/test after every 10 commits or each large change) before advancing.
3. Follow the sequencing steps documented in codex-0.50.0-upgrade-plan.md (core → exec → MCP → TUI → feedback → workflows/doc tooling → docs).
4. Maintain the macicodex sidecar architecture; do not mutate upstream submodule history.
5. Apply tooling commands exactly as listed (just fmt/fix, scoped cargo tests, insta workflows).
6. Record validation results and any regressions back into the upgrade plan.
7. Respect sandbox constraints (CODEX_SANDBOX, CODEX_SANDBOX_NETWORK_DISABLED); skip tests guarded by these vars.

Validation commands checklist:
- `just fmt`
- `just fix -p codex-core`, `-p codex-exec`, `-p codex-mcp-server`, `-p codex-tui`, `-p codex-feedback` (run per subsystem touched)
- `cargo test -p codex-core --all-features`
- `cargo test -p codex-core --test approvals`
- `cargo test -p codex-core --test unified_exec`
- `cargo test -p codex-exec`
- `cargo test -p codex-mcp-server`
- `cargo test -p codex-mcp-types`
- `cargo test -p codex-agentic -- mcp`
- `cargo test -p codex-tui`
- `cargo insta pending-snapshots -p codex-tui`
- `cargo test -p codex-feedback`
- `cargo test --all-features` (post-integration regression sweep)
- Manual smoke: `/index build`, feedback modal, approval flow, sandboxed exec commands, release workflow dry-run if feasible.

Completion criteria:
- Upstream changes merged while preserving downstream behaviour.
- All validation commands executed or documented with rationale if skipped.
- Follow-up tasks logged for remaining refactor checklist items.
- Upgrade plan checklist marked complete with final sign-off notes.
```

## Handoff Checklist
- [ ] Upgrade plan fully populated (scope snapshot, comparison table, sequencing, risks).
- [x] Tooling availability verified (`just`, `cargo-insta`, etc.).
- [ ] Outstanding questions resolved or assigned with due dates.
- [x] Development prompt updated with real SHAs, owners, and validation commands.
- [ ] Stakeholders acknowledged the handoff and timelines.
